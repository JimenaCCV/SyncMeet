const { body, param } = require('express-validator');

const agregarRules = [
  body('fechaHora')
    .notEmpty().withMessage('fechaHora es obligatoria')
    .isISO8601().withMessage('fechaHora no es una fecha válida (formato ISO 8601 requerido)'),
];

const opcionIdParam = param('opcionId').isMongoId().withMessage('ID de opción inválido');

module.exports = { agregarRules, opcionIdParam };
