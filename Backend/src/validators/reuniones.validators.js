const { body, param, query } = require('express-validator');

const ESTADOS = ['pendiente', 'confirmada', 'cancelada'];

const idParam = param('id').isMongoId().withMessage('ID de reunión inválido');

const crearRules = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ max: 200 }).withMessage('El título no puede superar 200 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede superar 1000 caracteres'),
];

const listarRules = [
  query('estado')
    .optional()
    .isIn(ESTADOS).withMessage('Estado inválido. Valores permitidos: pendiente, confirmada, cancelada'),
  query('titulo')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('El filtro de título no puede superar 200 caracteres'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe ser un entero entre 1 y 100'),
];

const editarRules = [
  idParam,
  body('titulo')
    .optional()
    .trim()
    .notEmpty().withMessage('El título no puede estar vacío')
    .isLength({ max: 200 }).withMessage('El título no puede superar 200 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede superar 1000 caracteres'),
];

const confirmarRules = [
  idParam,
  body('opcionId')
    .notEmpty().withMessage('Se requiere opcionId')
    .isMongoId().withMessage('opcionId inválido'),
];

module.exports = { crearRules, listarRules, editarRules, confirmarRules, idParam };
