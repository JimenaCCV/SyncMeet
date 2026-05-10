const notificacionRepo = require('../repositories/notificacion.repository');

const crearNotificacion = ({ usuarioId, tipo, mensaje, reunionId = null }) =>
  notificacionRepo.create({ usuarioId, tipo, mensaje, reunionId });

const notificarParticipantes = (participantesIds, tipo, mensaje, reunionId = null) => {
  const docs = participantesIds.map(id => ({ usuarioId: id, tipo, mensaje, reunionId }));
  return notificacionRepo.insertMany(docs);
};

module.exports = { crearNotificacion, notificarParticipantes };
