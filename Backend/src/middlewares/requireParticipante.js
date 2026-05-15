const participanteRepo = require('../repositories/participante.repository');
const { err } = require('../utils/respuesta');

const requireParticipante = async (req, res, next) => {
  try {
    const reunionId = req.params.id || req.params.reunionId;
    const participante = await participanteRepo.findOne({
      reunionId,
      usuarioId: req.usuarioId,
    });
    if (!participante) {
      return res.status(403).json(err('No eres participante de esta reunión', 'FORBIDDEN'));
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireParticipante;
