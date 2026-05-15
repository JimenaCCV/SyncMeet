const { body, param } = require('express-validator');

const reunionIdParam = param('reunionId').isMongoId().withMessage('ID de reunión inválido');

const registrarRules = [
  reunionIdParam,
  body('opcionHorarioId')
    .notEmpty().withMessage('opcionHorarioId es obligatorio')
    .isMongoId().withMessage('opcionHorarioId inválido'),
  body('disponible')
    .exists().withMessage('disponible es obligatorio')
    .isBoolean().withMessage('disponible debe ser true o false'),
];

const actualizarRules = [
  reunionIdParam,
  param('disponibilidadId').isMongoId().withMessage('ID de disponibilidad inválido'),
  body('disponible')
    .exists().withMessage('disponible es obligatorio')
    .isBoolean().withMessage('disponible debe ser true o false'),
];

const bulkRules = [
  reunionIdParam,
  body('respuestas')
    .isArray({ min: 1 }).withMessage('respuestas debe ser un array no vacío'),
  body('respuestas.*.opcionHorarioId')
    .notEmpty().withMessage('Cada respuesta requiere opcionHorarioId')
    .isMongoId().withMessage('opcionHorarioId inválido en respuestas'),
  body('respuestas.*.disponible')
    .exists().withMessage('disponible es obligatorio en cada respuesta')
    .isBoolean().withMessage('disponible debe ser true o false en cada respuesta'),
];

const listarRules = [reunionIdParam];
const coincidenciasRules = [reunionIdParam];

module.exports = { registrarRules, actualizarRules, bulkRules, listarRules, coincidenciasRules };
