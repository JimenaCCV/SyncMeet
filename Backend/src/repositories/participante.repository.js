const ParticipanteReunion = require('../models/ParticipanteReunion');

const create = (data) => ParticipanteReunion.create(data);
const findOne = (filter) => ParticipanteReunion.findOne(filter);
const find = (filter) => ParticipanteReunion.find(filter);
const findWithPopulate = (filter, populate) => ParticipanteReunion.find(filter).populate(populate);
const deleteById = (id) => ParticipanteReunion.deleteOne({ _id: id });
const deleteMany = (filter) => ParticipanteReunion.deleteMany(filter);

const findPaginated = async (filter, { page = 1, limit = 20 } = {}, populate) => {
  const skip = (page - 1) * limit;
  let q = ParticipanteReunion.find(filter).skip(skip).limit(limit);
  if (populate) q = q.populate(populate);
  const [docs, total] = await Promise.all([q, ParticipanteReunion.countDocuments(filter)]);
  return { docs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

module.exports = { create, findOne, find, findWithPopulate, deleteById, deleteMany, findPaginated };
