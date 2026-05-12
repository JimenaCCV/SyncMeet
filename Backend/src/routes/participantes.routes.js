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
const { agregarRules, usuarioIdParam } = require('../validators/participantes.validators');

router.post('/', requireAuth, requireOrganizador, agregarRules, validar, agregarParticipante);
router.get('/', requireAuth, requireParticipante, listarParticipantes);
router.delete('/:usuarioId', requireAuth, requireOrganizador, [usuarioIdParam], validar, eliminarParticipante);
router.post('/:usuarioId/reenviar-invitacion', requireAuth, requireOrganizador, [usuarioIdParam], validar, reenviarInvitacion);

module.exports = router;
