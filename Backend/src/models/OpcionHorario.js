const mongoose = require('mongoose');

const opcionHorarioSchema = new mongoose.Schema({
  reunionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reunion', required: true },
  fechaHora: { type: Date, required: true },
}, { timestamps: true });

opcionHorarioSchema.index({ reunionId: 1 });

module.exports = mongoose.model('OpcionHorario', opcionHorarioSchema);
