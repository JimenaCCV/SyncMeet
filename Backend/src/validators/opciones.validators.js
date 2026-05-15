const { body, param } = require('express-validator');

const reunionIdParam = param('reunionId').isMongoId().withMessage('ID de reunión inválido');

const agregarRules = [
  reunionIdParam,
  body('fechaHora')
    .notEmpty().withMessage('fechaHora es obligatoria')
    .isISO8601().withMessage('fechaHora no es una fecha válida (formato ISO 8601 requerido)'),
];

const listarRules = [reunionIdParam];

const opcionIdParam = param('opcionId').isMongoId().withMessage('ID de opción inválido');

const eliminarOpcionRules = [reunionIdParam, opcionIdParam];

module.exports = { agregarRules, listarRules, eliminarOpcionRules, opcionIdParam, reunionIdParam };
