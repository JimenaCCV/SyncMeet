const Notificacion = require('../models/Notificacion');
const { ok, err } = require('../utils/respuesta');

const obtenerNotificaciones = async (req, res, next) => {
  try {
    const notificaciones = await Notificacion.find({ usuarioId: req.usuarioId })
      .sort({ createdAt: -1 });
    res.json(ok(notificaciones));
  } catch (error) {
    next(error);
  }
};

const marcarLeida = async (req, res, next) => {
  try {
    const notificacion = await Notificacion.findById(req.params.id);

    if (!notificacion) {
      return res.status(404).json(err('Notificación no encontrada', 'NOT_FOUND'));
    }
    if (notificacion.usuarioId.toString() !== req.usuarioId) {
      return res.status(403).json(err('No tienes permiso para modificar esta notificación', 'FORBIDDEN'));
    }

    notificacion.leida = true;
    await notificacion.save();

    res.json(ok(notificacion));
  } catch (error) {
    next(error);
  }
};

// Marca todas las notificaciones del usuario como leídas en una sola operación
const marcarTodasLeidas = async (req, res, next) => {
  try {
    await Notificacion.updateMany({ usuarioId: req.usuarioId, leida: false }, { leida: true });
    res.json(ok({ mensaje: 'Todas las notificaciones marcadas como leídas' }));
  } catch (error) {
    next(error);
  }
};

module.exports = { obtenerNotificaciones, marcarLeida, marcarTodasLeidas };
