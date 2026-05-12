const { param, query } = require('express-validator');

const TIPOS = ['invitacion', 'confirmacion', 'cancelacion', 'recordatorio'];

const listarRules = [
  query('tipo')
    .optional()
    .isIn(TIPOS).withMessage('Tipo de notificación inválido. Valores permitidos: invitacion, confirmacion, cancelacion, recordatorio'),
  query('leida')
    .optional()
    .isBoolean().withMessage('leida debe ser true o false'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe ser un entero entre 1 y 100'),
];

const notifIdParam = param('id').isMongoId().withMessage('ID de notificación inválido');

module.exports = { listarRules, notifIdParam };
