const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  agregarParticipante, listarParticipantes,
  eliminarParticipante, reenviarInvitacion,
} = require('../controllers/participantes.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireOrganizador = require('../middlewares/requireOrganizador');
const requireParticipante = require('../middlewares/requireParticipante');

router.post('/', requireAuth, requireOrganizador, agregarParticipante);
router.get('/', requireAuth, requireParticipante, listarParticipantes);
router.delete('/:usuarioId', requireAuth, requireOrganizador, eliminarParticipante);
router.post('/:usuarioId/reenviar-invitacion', requireAuth, requireOrganizador, reenviarInvitacion);

module.exports = router;
