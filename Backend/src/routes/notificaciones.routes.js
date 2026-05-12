const express = require('express');
const router = express.Router();
const { obtenerNotificaciones, marcarLeida, marcarTodasLeidas } = require('../controllers/notificaciones.controller');
const requireAuth = require('../middlewares/requireAuth');
const validar = require('../middlewares/validar');
const { listarRules, notifIdParam } = require('../validators/notificaciones.validators');

router.get('/', requireAuth, listarRules, validar, obtenerNotificaciones);
router.put('/leer-todas', requireAuth, marcarTodasLeidas);
router.put('/:id/leida', requireAuth, [notifIdParam], validar, marcarLeida);

module.exports = router;
