const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  agregarParticipante, listarParticipantes,
  eliminarParticipante, reenviarInvitacion,
} = require('../controllers/participantes.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireOrganizador = require('../middlewares/requireOrganizador');
const requireParticipante = require('../middlewares/requireParticipante');
const validar = require('../middlewares/validar');
const { agregarRules, listarRules, eliminarParticipanteRules, reenviarInvitacionRules } = require('../validators/participantes.validators');

router.post('/', requireAuth, requireOrganizador, agregarRules, validar, agregarParticipante);
router.get('/', requireAuth, requireParticipante, listarRules, validar, listarParticipantes);
router.delete('/:usuarioId', requireAuth, requireOrganizador, eliminarParticipanteRules, validar, eliminarParticipante);
router.post('/:usuarioId/reenviar-invitacion', requireAuth, requireOrganizador, reenviarInvitacionRules, validar, reenviarInvitacion);

module.exports = router;
