const usuarioRepo = require('../repositories/usuario.repository');
const reunionRepo = require('../repositories/reunion.repository');
const participanteRepo = require('../repositories/participante.repository');
const disponibilidadRepo = require('../repositories/disponibilidad.repository');
const { crearNotificacion } = require('../services/notificacion.service');
const { enviarInvitacion } = require('../services/correo.service');
const { ok, err } = require('../utils/respuesta');

const agregarParticipante = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { reunionId } = req.params;

    const reunion = await reunionRepo.findById(reunionId);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }
    if (reunion.estado !== 'pendiente') {
      return res.status(400).json(err(`No se pueden agregar participantes a una reunión ${reunion.estado}`, 'INVALID_STATE'));
    }

    const usuario = await usuarioRepo.findByEmail(email.toLowerCase());
    if (!usuario) {
      return res.status(404).json(err('No existe una cuenta con ese email', 'NOT_FOUND'));
    }

    const yaExiste = await participanteRepo.findOne({ reunionId, usuarioId: usuario._id });
    if (yaExiste) {
      return res.status(409).json(err('El usuario ya es participante de esta reunión', 'CONFLICT'));
    }

    const participante = await participanteRepo.create({
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

// GET /api/reuniones/:reunionId/participantes?page=1&limit=20
const listarParticipantes = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const result = await participanteRepo.findPaginated(
      { reunionId: req.params.reunionId },
      { page: pageNum, limit: limitNum },
      { path: 'usuarioId', select: '-password' },
    );

    res.json(ok(result));
  } catch (error) {
    next(error);
  }
};

const eliminarParticipante = async (req, res, next) => {
  try {
    const { reunionId, usuarioId } = req.params;

    const participante = await participanteRepo.findOne({ reunionId, usuarioId });
    if (!participante) {
      return res.status(404).json(err('Participante no encontrado', 'NOT_FOUND'));
    }
    if (participante.rol === 'organizador') {
      return res.status(400).json(err('No se puede eliminar al organizador', 'INVALID_STATE'));
    }

    await disponibilidadRepo.deleteMany({ reunionId, participanteId: usuarioId });
    await participanteRepo.deleteById(participante._id);
    res.json(ok({ mensaje: 'Participante eliminado' }));
  } catch (error) {
    next(error);
  }
};

const reenviarInvitacion = async (req, res, next) => {
  try {
    const { reunionId, usuarioId } = req.params;

    const reunion = await reunionRepo.findById(reunionId);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }

    const participante = await participanteRepo.findOne({ reunionId, usuarioId });
    if (!participante) {
      return res.status(404).json(err('Participante no encontrado en esta reunión', 'NOT_FOUND'));
    }
    if (participante.rol === 'organizador') {
      return res.status(400).json(err('No se puede reenviar invitación al organizador', 'VALIDATION_ERROR'));
    }

    const usuario = await usuarioRepo.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json(err('Usuario no encontrado', 'NOT_FOUND'));
    }

    await crearNotificacion({
      usuarioId: usuario._id,
      tipo: 'invitacion',
      mensaje: `Recordatorio: fuiste invitado a la reunión "${reunion.titulo}"`,
      reunionId: reunion._id,
    });

    enviarInvitacion({ destinatario: usuario.email, nombre: usuario.nombre, reunion })
      .catch(e => console.error('[email] reenvío invitación error:', e));

    res.json(ok({ mensaje: 'Invitación reenviada correctamente' }));
  } catch (error) {
    next(error);
  }
};

module.exports = { agregarParticipante, listarParticipantes, eliminarParticipante, reenviarInvitacion };
