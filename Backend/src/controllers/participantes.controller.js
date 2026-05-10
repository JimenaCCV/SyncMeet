const Usuario = require('../models/Usuario');
const Reunion = require('../models/Reunion');
const ParticipanteReunion = require('../models/ParticipanteReunion');
const { crearNotificacion } = require('../services/notificacion.service');
const { enviarInvitacion } = require('../services/correo.service');
const { ok, err } = require('../utils/respuesta');
const { esEmailValido } = require('../utils/validaciones');

const agregarParticipante = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { reunionId } = req.params;

    if (!email || !esEmailValido(email)) {
      return res.status(400).json(err('Email válido requerido', 'VALIDATION_ERROR'));
    }

    const reunion = await Reunion.findById(reunionId);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    if (!usuario) {
      return res.status(404).json(err('No existe una cuenta con ese email', 'NOT_FOUND'));
    }

    const yaExiste = await ParticipanteReunion.findOne({ reunionId, usuarioId: usuario._id });
    if (yaExiste) {
      return res.status(409).json(err('El usuario ya es participante de esta reunión', 'CONFLICT'));
    }

    const participante = await ParticipanteReunion.create({
      reunionId,
      usuarioId: usuario._id,
      rol: 'participante',
      estado: 'pendiente',
    });

    await crearNotificacion({
      usuarioId: usuario._id,
      tipo: 'invitacion',
      mensaje: `Fuiste invitado a la reunión "${reunion.titulo}"`,
      reunionId: reunion._id,
    });

    // Fire-and-forget: el email no bloquea la respuesta HTTP
    enviarInvitacion({ destinatario: usuario.email, nombre: usuario.nombre, reunion })
      .catch(e => console.error('[email] invitación error:', e));

    res.status(201).json(ok(participante));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json(err('El usuario ya es participante de esta reunión', 'CONFLICT'));
    }
    next(error);
  }
};

const listarParticipantes = async (req, res, next) => {
  try {
    const participantes = await ParticipanteReunion.find({ reunionId: req.params.reunionId })
      .populate('usuarioId', '-password');
    res.json(ok(participantes));
  } catch (error) {
    next(error);
  }
};

const eliminarParticipante = async (req, res, next) => {
  try {
    const { reunionId, usuarioId } = req.params;

    const participante = await ParticipanteReunion.findOne({ reunionId, usuarioId });
    if (!participante) {
      return res.status(404).json(err('Participante no encontrado', 'NOT_FOUND'));
    }
    if (participante.rol === 'organizador') {
      return res.status(400).json(err('No se puede eliminar al organizador', 'INVALID_STATE'));
    }

    await participante.deleteOne();
    res.json(ok({ mensaje: 'Participante eliminado' }));
  } catch (error) {
    next(error);
  }
};

const reenviarInvitacion = async (req, res, next) => {
  try {
    const { reunionId, usuarioId } = req.params;

    const reunion = await Reunion.findById(reunionId);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }

    const participante = await ParticipanteReunion.findOne({ reunionId, usuarioId });
    if (!participante) {
      return res.status(404).json(err('Participante no encontrado en esta reunión', 'NOT_FOUND'));
    }
    if (participante.rol === 'organizador') {
      return res.status(400).json(err('No se puede reenviar invitación al organizador', 'VALIDATION_ERROR'));
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json(err('Usuario no encontrado', 'NOT_FOUND'));
    }

    await crearNotificacion({
      usuarioId: usuario._id,
      tipo: 'invitacion',
      mensaje: `Recordatorio: fuiste invitado a la reunión "${reunion.titulo}"`,
      reunionId: reunion._id,
    });

    // Fire-and-forget
    enviarInvitacion({ destinatario: usuario.email, nombre: usuario.nombre, reunion })
      .catch(e => console.error('[email] reenvío invitación error:', e));

    res.json(ok({ mensaje: 'Invitación reenviada correctamente' }));
  } catch (error) {
    next(error);
  }
};

module.exports = { agregarParticipante, listarParticipantes, eliminarParticipante, reenviarInvitacion };
