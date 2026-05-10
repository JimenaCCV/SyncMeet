const express = require('express');
const router = express.Router();
const {
  crearReunion, obtenerReuniones, obtenerReunion,
  editarReunion, confirmarReunion, cancelarReunion,
  recordarParticipantes, eliminarReunion,
} = require('../controllers/reuniones.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireOrganizador = require('../middlewares/requireOrganizador');

router.post('/', requireAuth, crearReunion);
router.get('/', requireAuth, obtenerReuniones);
router.get('/:id', requireAuth, obtenerReunion);
router.put('/:id', requireAuth, requireOrganizador, editarReunion);
router.put('/:id/confirmar', requireAuth, requireOrganizador, confirmarReunion);
router.put('/:id/cancelar', requireAuth, requireOrganizador, cancelarReunion);
router.post('/:id/recordar', requireAuth, requireOrganizador, recordarParticipantes);
router.delete('/:id', requireAuth, requireOrganizador, eliminarReunion);

module.exports = router;
