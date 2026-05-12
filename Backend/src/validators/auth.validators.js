const { body } = require('express-validator');

const registroRules = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no es válido'),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres')
    .isLength({ max: 128 }).withMessage('La contraseña no puede superar 128 caracteres'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no es válido'),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
];

module.exports = { registroRules, loginRules };
