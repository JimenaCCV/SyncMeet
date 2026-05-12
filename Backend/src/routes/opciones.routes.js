const express = require('express');
const router = express.Router({ mergeParams: true });
const { agregarOpcion, listarOpciones, eliminarOpcion } = require('../controllers/opciones.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireOrganizador = require('../middlewares/requireOrganizador');
const requireParticipante = require('../middlewares/requireParticipante');
const validar = require('../middlewares/validar');
const { agregarRules, opcionIdParam } = require('../validators/opciones.validators');

router.post('/', requireAuth, requireOrganizador, agregarRules, validar, agregarOpcion);
router.get('/', requireAuth, requireParticipante, listarOpciones);
router.delete('/:opcionId', requireAuth, requireOrganizador, [opcionIdParam], validar, eliminarOpcion);

module.exports = router;
