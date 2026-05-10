const Disponibilidad = require('../models/Disponibilidad');
const ParticipanteReunion = require('../models/ParticipanteReunion');

const calcularCoincidencias = async (reunionId) => {
  const [todasDisp, participantes] = await Promise.all([
    Disponibilidad.find({ reunionId }).populate('opcionHorarioId'),
    ParticipanteReunion.find({ reunionId }).populate('usuarioId', 'nombre email'),
  ]);

  // Por opción: cuántos dijeron sí y quiénes respondieron (sí o no)
  const mapa = {};
  for (const d of todasDisp) {
    const opcion = d.opcionHorarioId;
    if (!opcion) continue;
    const id = opcion._id.toString();
    if (!mapa[id]) mapa[id] = { opcion, cantidad: 0, respondieronSet: new Set() };
    mapa[id].respondieronSet.add(String(d.participanteId));
    if (d.disponible) mapa[id].cantidad++;
  }

  // Quiénes respondieron al menos una opción
  const respondieronGlobal = new Set();
  for (const entry of Object.values(mapa)) {
    for (const pid of entry.respondieronSet) respondieronGlobal.add(pid);
  }

  // Participantes que no han respondido ninguna opción
  const pendientes = participantes
    .filter(p => p.usuarioId && !respondieronGlobal.has(String(p.usuarioId._id)))
    .map(p => ({ _id: p.usuarioId._id, nombre: p.usuarioId.nombre }));

  const totalParticipantes = participantes.length;

  return Object.values(mapa)
    .map(({ opcion, cantidad, respondieronSet }) => ({
      opcion,
      cantidad,
      totalRespondieron: respondieronSet.size,
      totalParticipantes,
      pendientes,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
};

module.exports = { calcularCoincidencias };
