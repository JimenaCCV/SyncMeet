const { body, param } = require('express-validator');

const agregarRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email válido requerido'),
];

const usuarioIdParam = param('usuarioId').isMongoId().withMessage('ID de usuario inválido');

module.exports = { agregarRules, usuarioIdParam };
