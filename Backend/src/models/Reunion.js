const mongoose = require('mongoose');

const reunionSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  organizadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  estado: { type: String, enum: ['pendiente', 'confirmada', 'cancelada'], default: 'pendiente' },
  opcionConfirmadaId: { type: mongoose.Schema.Types.ObjectId, ref: 'OpcionHorario', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Reunion', reunionSchema);
