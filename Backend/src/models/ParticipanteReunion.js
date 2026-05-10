const mongoose = require('mongoose');

const participanteReunionSchema = new mongoose.Schema({
  reunionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reunion', required: true },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  rol: { type: String, enum: ['organizador', 'participante'], required: true },
  estado: { type: String, enum: ['pendiente', 'aceptado', 'rechazado'], default: 'pendiente' },
}, { timestamps: true });

participanteReunionSchema.index({ reunionId: 1, usuarioId: 1 }, { unique: true });

module.exports = mongoose.model('ParticipanteReunion', participanteReunionSchema);
