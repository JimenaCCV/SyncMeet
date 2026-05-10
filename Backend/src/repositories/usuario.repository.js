const Usuario = require('../models/Usuario');

const findByEmail = (email) => Usuario.findOne({ email });
const findById = (id, projection = '') => Usuario.findById(id).select(projection);
const create = (data) => Usuario.create(data);

module.exports = { findByEmail, findById, create };
