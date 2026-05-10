const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  registrarDisponibilidad, actualizarDisponibilidad,
  registrarDisponibilidadBulk,
  obtenerDisponibilidades, obtenerCoincidencias,
} = require('../controllers/disponibilidades.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireParticipante = require('../middlewares/requireParticipante');

router.post('/', requireAuth, requireParticipante, registrarDisponibilidad);
router.put('/bulk', requireAuth, requireParticipante, registrarDisponibilidadBulk);
router.put('/:disponibilidadId', requireAuth, requireParticipante, actualizarDisponibilidad);
router.get('/coincidencias', requireAuth, requireParticipante, obtenerCoincidencias);
router.get('/', requireAuth, requireParticipante, obtenerDisponibilidades);

module.exports = router;
