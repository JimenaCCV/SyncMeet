const Disponibilidad = require('../models/Disponibilidad');

const create = (data) => Disponibilidad.create(data);
const findOne = (filter) => Disponibilidad.findOne(filter);
const find = (filter) => Disponibilidad.find(filter);
const findWithPopulate = (filter, populate) => Disponibilidad.find(filter).populate(populate);
const save = (doc) => doc.save();
const deleteMany = (filter) => Disponibilidad.deleteMany(filter);

module.exports = { create, findOne, find, findWithPopulate, save, deleteMany };
