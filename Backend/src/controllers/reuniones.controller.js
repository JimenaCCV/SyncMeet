const Reunion = require('../models/Reunion');
const ParticipanteReunion = require('../models/ParticipanteReunion');
const OpcionHorario = require('../models/OpcionHorario');
const Disponibilidad = require('../models/Disponibilidad');
const { crearNotificacion, notificarParticipantes } = require('../services/notificacion.service');
const { enviarConfirmacion, enviarCancelacion, enviarRecordatorio } = require('../services/correo.service');
const { ok, err } = require('../utils/respuesta');

const crearReunion = async (req, res, next) => {
  try {
    const { titulo, descripcion } = req.body;
    if (!titulo || !titulo.trim()) {
      return res.status(400).json(err('El título es obligatorio', 'VALIDATION_ERROR'));
    }

    const reunion = await Reunion.create({
      titulo: titulo.trim(),
      descripcion: descripcion?.trim(),
      organizadorId: req.usuarioId,
    });

    await ParticipanteReunion.create({
      reunionId: reunion._id,
      usuarioId: req.usuarioId,
      rol: 'organizador',
      estado: 'aceptado',
    });

    res.status(201).json(ok(reunion));
  } catch (error) {
    next(error);
  }
};

const obtenerReuniones = async (req, res, next) => {
  try {
    const participaciones = await ParticipanteReunion.find({ usuarioId: req.usuarioId })
      .populate('reunionId')
      .sort({ createdAt: -1 });

    const reuniones = participaciones
      .filter(p => p.reunionId)
      .map(p => ({ ...p.reunionId.toObject(), miRol: p.rol, miEstado: p.estado }));

    res.json(ok(reuniones));
  } catch (error) {
    next(error);
  }
};

const obtenerReunion = async (req, res, next) => {
  try {
    const reunion = await Reunion.findById(req.params.id);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }

    const participacion = await ParticipanteReunion.findOne({
      reunionId: reunion._id,
      usuarioId: req.usuarioId,
    });
    if (!participacion) {
      return res.status(403).json(err('No tienes acceso a esta reunión', 'FORBIDDEN'));
    }

    res.json(ok({ ...reunion.toObject(), miRol: participacion.rol }));
  } catch (error) {
    next(error);
  }
};

const editarReunion = async (req, res, next) => {
  try {
    const { titulo, descripcion } = req.body;
    if (titulo !== undefined && !titulo.trim()) {
      return res.status(400).json(err('El título no puede estar vacío', 'VALIDATION_ERROR'));
    }

    const reunion = await Reunion.findById(req.params.id);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }
    if (reunion.estado !== 'pendiente') {
      return res.status(400).json(err(`No se puede editar una reunión ${reunion.estado}`, 'INVALID_STATE'));
    }

    const cambios = {};
    if (titulo) cambios.titulo = titulo.trim();
    if (descripcion !== undefined) cambios.descripcion = descripcion.trim();

    Object.assign(reunion, cambios);
    await reunion.save();

    res.json(ok(reunion));
  } catch (error) {
    next(error);
  }
};

const confirmarReunion = async (req, res, next) => {
  try {
    const { opcionId } = req.body;
    if (!opcionId) {
      return res.status(400).json(err('Se requiere opcionId', 'VALIDATION_ERROR'));
    }

    const reunion = await Reunion.findById(req.params.id);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }
    if (reunion.estado !== 'pendiente') {
      return res.status(400).json(err(`La reunión ya está ${reunion.estado}`, 'INVALID_STATE'));
    }

    // Validar que la opción pertenezca a esta reunión
    const opcion = await OpcionHorario.findOne({ _id: opcionId, reunionId: reunion._id });
    if (!opcion) {
      return res.status(404).json(err('La opción no pertenece a esta reunión', 'NOT_FOUND'));
    }

    // Advertir si se confirma una opción sin disponibilidades
    const dispCount = await Disponibilidad.find({ opcionHorarioId: opcion._id, disponible: true });
    if (dispCount.length === 0) {
      // No bloqueamos — solo advertimos en la respuesta al final
    }

    // Validar que haya al menos 1 participante además del organizador
    const totalParticipantes = await ParticipanteReunion.find({ reunionId: reunion._id });
    const soloOrganizador = totalParticipantes.every(p => p.rol === 'organizador');
    if (soloOrganizador || totalParticipantes.length <= 1) {
      return res.status(400).json(err('Debes agregar al menos un participante antes de confirmar', 'VALIDATION_ERROR'));
    }

    reunion.estado = 'confirmada';
    reunion.opcionConfirmadaId = opcion._id;
    await reunion.save();

    const participantes = await ParticipanteReunion.find({ reunionId: reunion._id })
      .populate('usuarioId');

    const fechaHora = new Date(opcion.fechaHora).toLocaleString('es-MX', {
      dateStyle: 'long', timeStyle: 'short',
    });
    const validos = participantes.filter(p => p.usuarioId);
    const ids = validos.map(p => p.usuarioId._id);

    await notificarParticipantes(
      ids, 'confirmacion',
      `La reunión "${reunion.titulo}" fue confirmada para el ${fechaHora}`,
      reunion._id,
    );

    // Fire-and-forget: los emails no bloquean la respuesta HTTP
    Promise.all(validos.map(p => enviarConfirmacion({
      destinatario: p.usuarioId.email,
      nombre: p.usuarioId.nombre,
      reunion,
      fechaHora,
    }))).catch(e => console.error('[email] confirmación error:', e));

    const respuesta = { ...reunion.toObject() };
    if (dispCount.length === 0) respuesta._aviso = 'Ningún participante había marcado disponibilidad para esta opción';

    res.json(ok(respuesta));
  } catch (error) {
    next(error);
  }
};

const cancelarReunion = async (req, res, next) => {
  try {
    const reunion = await Reunion.findById(req.params.id);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }
    if (reunion.estado === 'cancelada') {
      return res.status(400).json(err('La reunión ya está cancelada', 'INVALID_STATE'));
    }

    reunion.estado = 'cancelada';
    await reunion.save();

    const participantes = await ParticipanteReunion.find({ reunionId: reunion._id })
      .populate('usuarioId');

    const validos = participantes.filter(p => p.usuarioId);
    const ids = validos.map(p => p.usuarioId._id);

    await notificarParticipantes(
      ids, 'cancelacion',
      `La reunión "${reunion.titulo}" fue cancelada`,
      reunion._id,
    );

    // Fire-and-forget
    Promise.all(validos.map(p => enviarCancelacion({
      destinatario: p.usuarioId.email,
      nombre: p.usuarioId.nombre,
      reunion,
    }))).catch(e => console.error('[email] cancelación error:', e));

    res.json(ok(reunion));
  } catch (error) {
    next(error);
  }
};

// Envía recordatorio a participantes que no han respondido ninguna opción
const recordarParticipantes = async (req, res, next) => {
  try {
    const reunion = await Reunion.findById(req.params.id);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }
    if (reunion.estado !== 'pendiente') {
      return res.status(400).json(err(`No se puede recordar en una reunión ${reunion.estado}`, 'INVALID_STATE'));
    }

    const participantes = await ParticipanteReunion.find({ reunionId: reunion._id })
      .populate('usuarioId');

    // Quiénes han respondido al menos una opción
    const dispTodas = await Disponibilidad.find({ reunionId: reunion._id });
    const respondieronIds = new Set(dispTodas.map(d => String(d.participanteId)));

    const pendientes = participantes.filter(
      p => p.usuarioId && !respondieronIds.has(String(p.usuarioId._id))
    );

    if (pendientes.length === 0) {
      return res.json(ok({ mensaje: 'Todos los participantes ya han respondido su disponibilidad' }));
    }

    const ids = pendientes.map(p => p.usuarioId._id);
    await notificarParticipantes(
      ids, 'recordatorio',
      `Recuerda responder tu disponibilidad para la reunión "${reunion.titulo}"`,
      reunion._id,
    );

    // Fire-and-forget
    Promise.all(pendientes.map(p => enviarRecordatorio({
      destinatario: p.usuarioId.email,
      nombre: p.usuarioId.nombre,
      reunion,
    }))).catch(e => console.error('[email] recordatorio error:', e));

    res.json(ok({ mensaje: `Recordatorio enviado a ${pendientes.length} participante(s) pendiente(s)` }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearReunion, obtenerReuniones, obtenerReunion,
  editarReunion, confirmarReunion, cancelarReunion,
  recordarParticipantes,
};
