const express = require('express');
const router = express.Router({ mergeParams: true });
const { agregarOpcion, listarOpciones, eliminarOpcion } = require('../controllers/opciones.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireOrganizador = require('../middlewares/requireOrganizador');
const requireParticipante = require('../middlewares/requireParticipante');
const validar = require('../middlewares/validar');
const { agregarRules, listarRules, eliminarOpcionRules } = require('../validators/opciones.validators');

router.post('/', requireAuth, requireOrganizador, agregarRules, validar, agregarOpcion);
router.get('/', requireAuth, requireParticipante, listarRules, validar, listarOpciones);
router.delete('/:opcionId', requireAuth, requireOrganizador, eliminarOpcionRules, validar, eliminarOpcion);

module.exports = router;
