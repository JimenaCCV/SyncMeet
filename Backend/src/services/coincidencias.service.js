const disponibilidadRepo = require('../repositories/disponibilidad.repository');
const participanteRepo = require('../repositories/participante.repository');

const calcularCoincidencias = async (reunionId) => {
  const [todasDisp, participantes] = await Promise.all([
    disponibilidadRepo.findWithPopulate({ reunionId }, 'opcionHorarioId'),
    participanteRepo.findWithPopulate({ reunionId }, { path: 'usuarioId', select: 'nombre email' }),
  ]);

  const mapa = {};
  for (const d of todasDisp) {
    const opcion = d.opcionHorarioId;
    if (!opcion) continue;
    const id = opcion._id.toString();
    if (!mapa[id]) mapa[id] = { opcion, cantidad: 0, respondieronSet: new Set() };
    mapa[id].respondieronSet.add(String(d.participanteId));
    if (d.disponible) mapa[id].cantidad++;
  }

  const respondieronGlobal = new Set();
  for (const entry of Object.values(mapa)) {
    for (const pid of entry.respondieronSet) respondieronGlobal.add(pid);
  }

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
