const Notificacion = require('../models/Notificacion');

const create = (data) => Notificacion.create(data);
const insertMany = (docs) => Notificacion.insertMany(docs, { ordered: false });
const findOne = (filter) => Notificacion.findOne(filter);
const save = (doc) => doc.save();
const updateMany = (filter, update) => Notificacion.updateMany(filter, update);

const findPaginated = async (filter, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    Notificacion.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notificacion.countDocuments(filter),
  ]);
  return { docs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

module.exports = { create, insertMany, findOne, save, updateMany, findPaginated };
