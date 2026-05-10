const Reunion = require('../models/Reunion');
const ParticipanteReunion = require('../models/ParticipanteReunion');

const create = (data) => Reunion.create(data);
const findById = (id) => Reunion.findById(id);
const findByIdAndDelete = (id) => Reunion.findByIdAndDelete(id);
const save = (doc) => doc.save();

const findByUsuario = async (usuarioId, { estado, titulo, page = 1, limit = 10 } = {}) => {
  const participaciones = await ParticipanteReunion.find({ usuarioId });
  const reunionIds = participaciones.map(p => p.reunionId);

  const query = { _id: { $in: reunionIds } };
  if (estado) query.estado = estado;
  if (titulo) query.titulo = { $regex: titulo, $options: 'i' };

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    Reunion.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Reunion.countDocuments(query),
  ]);

  const rolMap = {};
  for (const p of participaciones) {
    rolMap[String(p.reunionId)] = { rol: p.rol, estado: p.estado };
  }

  const reuniones = docs.map(r => ({
    ...r.toObject(),
    miRol: rolMap[String(r._id)]?.rol,
    miEstado: rolMap[String(r._id)]?.estado,
  }));

  return { reuniones, total, page, limit, totalPages: Math.ceil(total / limit) };
};

module.exports = { create, findById, findByIdAndDelete, save, findByUsuario };
