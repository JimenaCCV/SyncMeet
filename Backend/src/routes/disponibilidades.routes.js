const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  registrarDisponibilidad, actualizarDisponibilidad,
  registrarDisponibilidadBulk,
  obtenerDisponibilidades, obtenerCoincidencias,
} = require('../controllers/disponibilidades.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireParticipante = require('../middlewares/requireParticipante');
const validar = require('../middlewares/validar');
const { registrarRules, actualizarRules, bulkRules, listarRules, coincidenciasRules } = require('../validators/disponibilidades.validators');

router.post('/', requireAuth, requireParticipante, registrarRules, validar, registrarDisponibilidad);
router.put('/bulk', requireAuth, requireParticipante, bulkRules, validar, registrarDisponibilidadBulk);
router.put('/:disponibilidadId', requireAuth, requireParticipante, actualizarRules, validar, actualizarDisponibilidad);
router.get('/coincidencias', requireAuth, requireParticipante, coincidenciasRules, validar, obtenerCoincidencias);
router.get('/', requireAuth, requireParticipante, listarRules, validar, obtenerDisponibilidades);

module.exports = router;
