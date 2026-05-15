const { body, param, query } = require('express-validator');

const reunionIdParam = param('reunionId').isMongoId().withMessage('ID de reunión inválido');

const agregarRules = [
  reunionIdParam,
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email válido requerido'),
];

const listarRules = [
  reunionIdParam,
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser un entero entre 1 y 100'),
];

const usuarioIdParam = param('usuarioId').isMongoId().withMessage('ID de usuario inválido');

const eliminarParticipanteRules = [reunionIdParam, usuarioIdParam];

const reenviarInvitacionRules = [reunionIdParam, usuarioIdParam];

module.exports = { agregarRules, listarRules, eliminarParticipanteRules, reenviarInvitacionRules, usuarioIdParam };
