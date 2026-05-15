const { err } = require('../utils/respuesta');

const errorHandler = (error, req, res, next) => {
  console.error(error);

  if (error.name === 'CastError') {
    return res.status(400).json(err('ID inválido', 'VALIDATION_ERROR'));
  }

  if (error.name === 'ValidationError') {
    const mensaje = Object.values(error.errors).map(e => e.message).join(', ');
    return res.status(400).json(err(mensaje, 'VALIDATION_ERROR'));
  }

  if (error.code === 11000) {
    return res.status(409).json(err('Ya existe un registro con esos datos', 'CONFLICT'));
  }

  const status = error.status || 500;
  res.status(status).json(err(error.message || 'Error interno del servidor', 'SERVER_ERROR'));
};

module.exports = errorHandler;
