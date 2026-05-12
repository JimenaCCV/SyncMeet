const express = require('express');
const router = express.Router();
const { registro, login, logout, perfil } = require('../controllers/auth.controller');
const requireAuth = require('../middlewares/requireAuth');
const validar = require('../middlewares/validar');
const { registroRules, loginRules } = require('../validators/auth.validators');

router.post('/registro', registroRules, validar, registro);
router.post('/login', loginRules, validar, login);
router.post('/logout', requireAuth, logout);
router.get('/perfil', requireAuth, perfil);

module.exports = router;
