const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { ok, err } = require('../utils/respuesta');
const { esEmailValido } = require('../utils/validaciones');

const registro = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json(err('Nombre, email y contraseña son obligatorios', 'VALIDATION_ERROR'));
    }
    if (typeof nombre !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json(err('Formato de datos inválido', 'VALIDATION_ERROR'));
    }
    if (!esEmailValido(email)) {
      return res.status(400).json(err('El email no es válido', 'VALIDATION_ERROR'));
    }
    if (password.length < 8) {
      return res.status(400).json(err('La contraseña debe tener mínimo 8 caracteres', 'VALIDATION_ERROR'));
    }
    if (password.length > 128) {
      return res.status(400).json(err('La contraseña no puede superar 128 caracteres', 'VALIDATION_ERROR'));
    }

    const emailNorm = email.toLowerCase();
    const existe = await Usuario.findOne({ email: emailNorm });
    if (existe) {
      return res.status(409).json(err('El email ya está registrado', 'CONFLICT'));
    }

    const hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({ nombre, email: emailNorm, password: hash });

    res.status(201).json(ok({ _id: usuario._id, nombre: usuario.nombre, email: usuario.email }));
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(err('Email y contraseña son obligatorios', 'VALIDATION_ERROR'));
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json(err('Formato de datos inválido', 'VALIDATION_ERROR'));
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    if (!usuario) {
      return res.status(401).json(err('Credenciales incorrectas', 'AUTH_REQUIRED'));
    }

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) {
      return res.status(401).json(err('Credenciales incorrectas', 'AUTH_REQUIRED'));
    }

    const token = jwt.sign({ id: usuario._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json(ok({
      token,
      usuario: { _id: usuario._id, nombre: usuario.nombre, email: usuario.email }
    }));
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.json(ok({ mensaje: 'Sesión cerrada' }));
  } catch (error) {
    next(error);
  }
};

const perfil = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuarioId).select('-password');
    if (!usuario) {
      return res.status(404).json(err('Usuario no encontrado', 'NOT_FOUND'));
    }
    res.json(ok({ _id: usuario._id, nombre: usuario.nombre, email: usuario.email }));
  } catch (error) {
    next(error);
  }
};

module.exports = { registro, login, logout, perfil };
