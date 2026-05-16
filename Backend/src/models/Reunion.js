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
  eliminada: { type: Boolean, default: false },
}, { timestamps: true });

// Registra cada transición de estado en el historial embebido
reunionSchema.pre('save', function (next) {
  if (this.isModified('estado')) {
    this.historialEstados.push({ estado: this.estado, fecha: new Date() });
  }
  next();
});

// Excluye reuniones eliminadas de todos los queries find* automáticamente.
// Usa $ne: true para incluir también documentos que no tienen el campo (datos previos a la migración).
reunionSchema.pre(/^find/, function (next) {
  this.where({ eliminada: { $ne: true } });
  next();
});

// Archiva las disponibilidades asociadas cuando la reunión se marca como eliminada
reunionSchema.post('save', async function (doc) {
  if (!doc.eliminada) return;
  try {
    const Disponibilidad = require('./Disponibilidad');
    await Disponibilidad.updateMany(
      { reunionId: doc._id },
      { $set: { archivada: true } }
    );
  } catch (error) {
    console.error('[hook] Error archivando disponibilidades:', error);
  }
});

module.exports = mongoose.model('Reunion', reunionSchema);
