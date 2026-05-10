const Notificacion = require('../models/Notificacion');

const crearNotificacion = async ({ usuarioId, tipo, mensaje, reunionId = null }) => {
  return await Notificacion.create({ usuarioId, tipo, mensaje, reunionId });
};

const notificarParticipantes = async (participantesIds, tipo, mensaje, reunionId = null) => {
  const docs = participantesIds.map(id => ({ usuarioId: id, tipo, mensaje, reunionId }));
  await Notificacion.insertMany(docs, { ordered: false });
};

module.exports = { crearNotificacion, notificarParticipantes };
