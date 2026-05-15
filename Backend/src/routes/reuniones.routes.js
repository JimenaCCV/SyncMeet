const express = require('express');
const router = express.Router();
const {
  crearReunion, obtenerReuniones, obtenerReunion,
  editarReunion, confirmarReunion, cancelarReunion,
  recordarParticipantes, eliminarReunion,
} = require('../controllers/reuniones.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireOrganizador = require('../middlewares/requireOrganizador');
const validar = require('../middlewares/validar');
const { crearRules, listarRules, editarRules, confirmarRules, cancelarRules, recordarRules, eliminarRules, idParam } = require('../validators/reuniones.validators');

router.post('/', requireAuth, crearRules, validar, crearReunion);
router.get('/', requireAuth, listarRules, validar, obtenerReuniones);
router.get('/:id', requireAuth, [idParam], validar, obtenerReunion);
router.put('/:id', requireAuth, requireOrganizador, editarRules, validar, editarReunion);
router.put('/:id/confirmar', requireAuth, requireOrganizador, confirmarRules, validar, confirmarReunion);
router.put('/:id/cancelar', requireAuth, requireOrganizador, cancelarRules, validar, cancelarReunion);
router.post('/:id/recordar', requireAuth, requireOrganizador, recordarRules, validar, recordarParticipantes);
router.delete('/:id', requireAuth, requireOrganizador, eliminarRules, validar, eliminarReunion);

module.exports = router;
