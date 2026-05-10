const OpcionHorario = require('../models/OpcionHorario');

const create = (data) => OpcionHorario.create(data);
const findOne = (filter) => OpcionHorario.findOne(filter);
const find = (filter, sort) => {
  const q = OpcionHorario.find(filter);
  return sort ? q.sort(sort) : q;
};
const deleteDoc = (doc) => doc.deleteOne();
const deleteMany = (filter) => OpcionHorario.deleteMany(filter);

module.exports = { create, findOne, find, deleteDoc, deleteMany };
