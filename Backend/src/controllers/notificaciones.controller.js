const notificacionRepo = require('../repositories/notificacion.repository');
const { ok, err } = require('../utils/respuesta');

const TIPOS_VALIDOS = ['invitacion', 'confirmacion', 'cancelacion', 'recordatorio'];

// GET /api/notificaciones?leida=false&tipo=invitacion&page=1&limit=20
const obtenerNotificaciones = async (req, res, next) => {
  try {
    const { leida, tipo, page, limit } = req.query;

    const filter = { usuarioId: req.usuarioId };

    if (leida !== undefined) filter.leida = leida === 'true';
    if (tipo) {
      if (!TIPOS_VALIDOS.includes(tipo)) {
        return res.status(400).json(err('Tipo de notificación inválido', 'VALIDATION_ERROR'));
      }
      filter.tipo = tipo;
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const result = await notificacionRepo.findPaginated(filter, { page: pageNum, limit: limitNum });
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
};

const marcarLeida = async (req, res, next) => {
  try {
    const notificacion = await notificacionRepo.findOne({ _id: req.params.id });

    if (!notificacion) {
      return res.status(404).json(err('Notificación no encontrada', 'NOT_FOUND'));
    }
    if (notificacion.usuarioId.toString() !== req.usuarioId) {
      return res.status(403).json(err('No tienes permiso para modificar esta notificación', 'FORBIDDEN'));
    }

    notificacion.leida = true;
    await notificacionRepo.save(notificacion);

    res.json(ok(notificacion));
  } catch (error) {
    next(error);
  }
};

const marcarTodasLeidas = async (req, res, next) => {
  try {
    await notificacionRepo.updateMany({ usuarioId: req.usuarioId, leida: false }, { leida: true });
    res.json(ok({ mensaje: 'Todas las notificaciones marcadas como leídas' }));
  } catch (error) {
    next(error);
  }
};

module.exports = { obtenerNotificaciones, marcarLeida, marcarTodasLeidas };
