const { validationResult } = require('express-validator');

const validar = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return res.status(400).json({ success: false, error: first.msg, code: 'VALIDATION_ERROR' });
  }
  next();
};

module.exports = validar;
