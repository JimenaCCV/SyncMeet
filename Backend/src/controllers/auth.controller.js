const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioRepo = require('../repositories/usuario.repository');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { ok, err } = require('../utils/respuesta');

// COOKIE_SECURE=true debe estar seteado en Railway (producción cross-origin)
// En desarrollo local con backend local no es necesario (same-site)
const secureCookies = process.env.COOKIE_SECURE === 'true';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: secureCookies ? 'none' : 'lax',
  secure: secureCookies,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registro = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    const emailNorm = email.toLowerCase();
    const existe = await usuarioRepo.findByEmail(emailNorm);
    if (existe) {
      return res.status(409).json(err('El email ya está registrado', 'CONFLICT'));
    }

    const usuario = await usuarioRepo.create({ nombre: nombre.trim(), email: emailNorm, password });

    res.status(201).json(ok({ _id: usuario._id, nombre: usuario.nombre, email: usuario.email }));
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const usuario = await usuarioRepo.findByEmail(email.toLowerCase());
    if (!usuario) {
      return res.status(401).json(err('Credenciales incorrectas', 'AUTH_REQUIRED'));
    }

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) {
      return res.status(401).json(err('Credenciales incorrectas', 'AUTH_REQUIRED'));
    }

    const token = jwt.sign({ id: usuario._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.cookie('token', token, COOKIE_OPTIONS);
    res.json(ok({ usuario: { _id: usuario._id, nombre: usuario.nombre, email: usuario.email } }));
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie('token', { httpOnly: true, sameSite: secureCookies ? 'none' : 'lax', secure: secureCookies });
    res.json(ok({ mensaje: 'Sesión cerrada' }));
  } catch (error) {
    next(error);
  }
};

const perfil = async (req, res, next) => {
  try {
    const usuario = await usuarioRepo.findById(req.usuarioId, '-password');
    if (!usuario) {
      return res.status(404).json(err('Usuario no encontrado', 'NOT_FOUND'));
    }
    res.json(ok({ _id: usuario._id, nombre: usuario.nombre, email: usuario.email }));
  } catch (error) {
    next(error);
  }
};

module.exports = { registro, login, logout, perfil };
