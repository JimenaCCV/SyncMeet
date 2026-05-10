const mongoose = require('mongoose');

const disponibilidadSchema = new mongoose.Schema({
  reunionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reunion', required: true },
  participanteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  opcionHorarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'OpcionHorario', required: true },
  disponible: { type: Boolean, required: true },
}, { timestamps: true });

disponibilidadSchema.index({ reunionId: 1, participanteId: 1, opcionHorarioId: 1 }, { unique: true });

module.exports = mongoose.model('Disponibilidad', disponibilidadSchema);
