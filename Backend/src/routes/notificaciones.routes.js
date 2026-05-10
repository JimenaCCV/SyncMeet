const express = require('express');
const router = express.Router();
const { obtenerNotificaciones, marcarLeida, marcarTodasLeidas } = require('../controllers/notificaciones.controller');
const requireAuth = require('../middlewares/requireAuth');

router.get('/', requireAuth, obtenerNotificaciones);
router.put('/leer-todas', requireAuth, marcarTodasLeidas);
router.put('/:id/leida', requireAuth, marcarLeida);

module.exports = router;
