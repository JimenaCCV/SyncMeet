const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { err } = require('../utils/respuesta');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(err('Token no proporcionado', 'AUTH_REQUIRED'));
  }
  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuarioId = payload.id;
    next();
  } catch {
    res.status(401).json(err('Token inválido o expirado', 'AUTH_REQUIRED'));
  }
};

module.exports = requireAuth;
