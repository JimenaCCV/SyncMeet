const mongoose = require('mongoose');

// Documento embebido: auditoría de cambios de estado.
// Se usa embedded porque los cambios son propios de la reunión,
// no se consultan de forma independiente y su volumen es acotado.
const historialEstadoSchema = new mongoose.Schema({
  estado: { type: String, enum: ['pendiente', 'confirmada', 'cancelada'], required: true },
  fecha: { type: Date, default: Date.now },
}, { _id: false });

const reunionSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  organizadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  estado: { type: String, enum: ['pendiente', 'confirmada', 'cancelada'], default: 'pendiente' },
  opcionConfirmadaId: { type: mongoose.Schema.Types.ObjectId, ref: 'OpcionHorario', default: null },
  historialEstados: { type: [historialEstadoSchema], default: [] },
}, { timestamps: true });

// Registra cada transición de estado en el historial embebido
reunionSchema.pre('save', function (next) {
  if (this.isModified('estado')) {
    this.historialEstados.push({ estado: this.estado, fecha: new Date() });
  }
  next();
});

module.exports = mongoose.model('Reunion', reunionSchema);
