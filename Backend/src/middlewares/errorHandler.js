const { err } = require('../utils/respuesta');

const errorHandler = (error, req, res, next) => {
  console.error(error);
  if (error.name === 'CastError') {
    return res.status(400).json(err('ID inválido', 'VALIDATION_ERROR'));
  }
  const status = error.status || 500;
  res.status(status).json(err(error.message || 'Error interno del servidor', 'SERVER_ERROR'));
};

module.exports = errorHandler;
