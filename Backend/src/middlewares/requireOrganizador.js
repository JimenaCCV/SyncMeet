const ParticipanteReunion = require('../models/ParticipanteReunion');
const { err } = require('../utils/respuesta');

const requireOrganizador = async (req, res, next) => {
  try {
    const reunionId = req.params.id || req.params.reunionId;
    const participante = await ParticipanteReunion.findOne({
      reunionId,
      usuarioId: req.usuarioId,
      rol: 'organizador',
    });
    if (!participante) {
      return res.status(403).json(err('Solo el organizador puede realizar esta acción', 'FORBIDDEN'));
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireOrganizador;
