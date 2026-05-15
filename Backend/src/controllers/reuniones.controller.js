const reunionRepo = require('../repositories/reunion.repository');
const participanteRepo = require('../repositories/participante.repository');
const opcionRepo = require('../repositories/opcion.repository');
const disponibilidadRepo = require('../repositories/disponibilidad.repository');
const { crearNotificacion, notificarParticipantes } = require('../services/notificacion.service');
const { enviarConfirmacion, enviarCancelacion, enviarRecordatorio } = require('../services/correo.service');
const { ok, err } = require('../utils/respuesta');

const crearReunion = async (req, res, next) => {
  try {
    const { titulo, descripcion } = req.body;

    const reunion = await reunionRepo.create({
      titulo: titulo.trim(),
      descripcion: descripcion?.trim(),
      organizadorId: req.usuarioId,
    });

    await participanteRepo.create({
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

// GET /api/reuniones?estado=pendiente&titulo=standup&page=1&limit=10
const obtenerReuniones = async (req, res, next) => {
  try {
    const { estado, titulo, page, limit } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    const result = await reunionRepo.findByUsuario(req.usuarioId, {
      estado,
      titulo,
      page: pageNum,
      limit: limitNum,
    });

    res.json(ok(result));
  } catch (error) {
    next(error);
  }
};

const obtenerReunion = async (req, res, next) => {
  try {
    const reunion = await reunionRepo.findById(req.params.id);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }

    const participacion = await participanteRepo.findOne({
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

    const reunion = await reunionRepo.findById(req.params.id);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }
    if (reunion.estado !== 'pendiente') {
      return res.status(400).json(err(`No se puede editar una reunión ${reunion.estado}`, 'INVALID_STATE'));
    }

    if (titulo) reunion.titulo = titulo.trim();
    if (descripcion !== undefined) reunion.descripcion = descripcion.trim();

    await reunionRepo.save(reunion);

    res.json(ok(reunion));
  } catch (error) {
    next(error);
  }
};

const confirmarReunion = async (req, res, next) => {
  try {
    const { opcionId } = req.body;

    const reunion = await reunionRepo.findById(req.params.id);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }
    if (reunion.estado !== 'pendiente') {
      return res.status(400).json(err(`La reunión ya está ${reunion.estado}`, 'INVALID_STATE'));
    }

    const opcion = await opcionRepo.findOne({ _id: opcionId, reunionId: reunion._id });
    if (!opcion) {
      return res.status(404).json(err('La opción no pertenece a esta reunión', 'NOT_FOUND'));
    }

    const dispCount = await disponibilidadRepo.find({ opcionHorarioId: opcion._id, disponible: true });

    const totalParticipantes = await participanteRepo.find({ reunionId: reunion._id });
    const soloOrganizador = totalParticipantes.every(p => p.rol === 'organizador');
    if (soloOrganizador || totalParticipantes.length <= 1) {
      return res.status(400).json(err('Debes agregar al menos un participante antes de confirmar', 'VALIDATION_ERROR'));
    }

    reunion.estado = 'confirmada';
    reunion.opcionConfirmadaId = opcion._id;
    await reunionRepo.save(reunion);

    const participantes = await participanteRepo.findWithPopulate({ reunionId: reunion._id }, 'usuarioId');

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
    const reunion = await reunionRepo.findById(req.params.id);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }
    // Se permite cancelar reuniones en estado 'pendiente' o 'confirmada'
    if (reunion.estado === 'cancelada') {
      return res.status(400).json(err('La reunión ya está cancelada', 'INVALID_STATE'));
    }

    reunion.estado = 'cancelada';
    await reunionRepo.save(reunion);

    const participantes = await participanteRepo.findWithPopulate({ reunionId: reunion._id }, 'usuarioId');

    const validos = participantes.filter(p => p.usuarioId);
    const ids = validos.map(p => p.usuarioId._id);

    await notificarParticipantes(
      ids, 'cancelacion',
      `La reunión "${reunion.titulo}" fue cancelada`,
      reunion._id,
    );

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

const recordarParticipantes = async (req, res, next) => {
  try {
    const reunion = await reunionRepo.findById(req.params.id);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }
    if (reunion.estado !== 'pendiente') {
      return res.status(400).json(err(`No se puede recordar en una reunión ${reunion.estado}`, 'INVALID_STATE'));
    }

    const participantes = await participanteRepo.findWithPopulate({ reunionId: reunion._id }, 'usuarioId');

    // DECISIÓN DE DISEÑO: se considera que un participante "respondió" si registró
    // disponibilidad para al menos una opción de la reunión.
    const dispTodas = await disponibilidadRepo.find({ reunionId: reunion._id });
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

const eliminarReunion = async (req, res, next) => {
  try {
    const reunion = await reunionRepo.findById(req.params.id);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }

    if (String(reunion.organizadorId) !== String(req.usuarioId)) {
      return res.status(403).json(err('Solo el organizador puede eliminar la reunión', 'FORBIDDEN'));
    }

    reunion.eliminada = true;
    await reunionRepo.save(reunion);

    res.json(ok({ mensaje: 'Reunión eliminada del dashboard' }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearReunion, obtenerReuniones, obtenerReunion,
  editarReunion, confirmarReunion, cancelarReunion,
  recordarParticipantes, eliminarReunion,
};
