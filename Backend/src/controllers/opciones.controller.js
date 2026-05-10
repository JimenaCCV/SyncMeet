const Reunion = require('../models/Reunion');
const OpcionHorario = require('../models/OpcionHorario');
const Disponibilidad = require('../models/Disponibilidad');
const ParticipanteReunion = require('../models/ParticipanteReunion');
const { crearNotificacion } = require('../services/notificacion.service');
const { ok, err } = require('../utils/respuesta');
const { esFechaFutura } = require('../utils/validaciones');

const MS_1_HORA = 60 * 60 * 1000;
const MS_1_ANIO = 365 * 24 * MS_1_HORA;

const agregarOpcion = async (req, res, next) => {
  try {
    const { fechaHora } = req.body;
    const { reunionId } = req.params;

    if (!fechaHora) {
      return res.status(400).json(err('fechaHora es obligatoria', 'VALIDATION_ERROR'));
    }

    const fecha = new Date(fechaHora);
    if (isNaN(fecha.getTime())) {
      return res.status(400).json(err('fechaHora no es una fecha válida', 'VALIDATION_ERROR'));
    }

    const ahora = new Date();
    // Mínimo: 1 hora en el futuro
    if (fecha.getTime() <= ahora.getTime() + MS_1_HORA) {
      return res.status(400).json(err('La fecha debe ser al menos 1 hora en el futuro', 'VALIDATION_ERROR'));
    }
    // Máximo: 1 año en el futuro
    if (fecha.getTime() > ahora.getTime() + MS_1_ANIO) {
      return res.status(400).json(err('La fecha no puede ser mayor a 1 año en el futuro', 'VALIDATION_ERROR'));
    }

    const reunion = await Reunion.findById(reunionId);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }
    if (reunion.estado !== 'pendiente') {
      return res.status(400).json(err(`No se pueden agregar opciones a una reunión ${reunion.estado}`, 'INVALID_STATE'));
    }

    // Verificar duplicado de fecha+hora en la misma reunión
    const duplicado = await OpcionHorario.findOne({ reunionId, fechaHora: fecha });
    if (duplicado) {
      return res.status(409).json(err('Ya existe esa opción de horario en esta reunión', 'CONFLICT'));
    }

    const opcion = await OpcionHorario.create({ reunionId, fechaHora: fecha });
    res.status(201).json(ok(opcion));
  } catch (error) {
    next(error);
  }
};

const listarOpciones = async (req, res, next) => {
  try {
    const opciones = await OpcionHorario.find({ reunionId: req.params.reunionId })
      .sort({ fechaHora: 1 });
    res.json(ok(opciones));
  } catch (error) {
    next(error);
  }
};

const eliminarOpcion = async (req, res, next) => {
  try {
    const { reunionId, opcionId } = req.params;

    const opcion = await OpcionHorario.findOne({ _id: opcionId, reunionId });
    if (!opcion) {
      return res.status(404).json(err('Opción no encontrada', 'NOT_FOUND'));
    }

    // Notificar a quienes habían respondido que esa opción fue eliminada
    const afectados = await Disponibilidad.find({ opcionHorarioId: opcionId });
    if (afectados.length > 0) {
      const reunion = await Reunion.findById(reunionId);
      const tituloReunion = reunion ? reunion.titulo : 'la reunión';
      const idsAfectados = [...new Set(afectados.map(d => String(d.participanteId)))];
      await Promise.all(idsAfectados.map(usuarioId =>
        crearNotificacion({
          usuarioId,
          tipo: 'recordatorio',
          mensaje: `Una opción de horario fue eliminada de la reunión "${tituloReunion}"`,
          reunionId,
        }).catch(() => {})
      ));
    }

    await Disponibilidad.deleteMany({ opcionHorarioId: opcionId });
    await opcion.deleteOne();
    res.json(ok({ mensaje: 'Opción eliminada' }));
  } catch (error) {
    next(error);
  }
};

module.exports = { agregarOpcion, listarOpciones, eliminarOpcion };
