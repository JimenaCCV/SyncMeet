const reunionRepo = require('../repositories/reunion.repository');
const opcionRepo = require('../repositories/opcion.repository');
const disponibilidadRepo = require('../repositories/disponibilidad.repository');
const participanteRepo = require('../repositories/participante.repository');
const { crearNotificacion, notificarParticipantes } = require('../services/notificacion.service');
const { ok, err } = require('../utils/respuesta');

const MS_1_HORA = 60 * 60 * 1000;
const MS_1_ANIO = 365 * 24 * MS_1_HORA;

const agregarOpcion = async (req, res, next) => {
  try {
    const { fechaHora } = req.body;
    const { reunionId } = req.params;

    const fecha = new Date(fechaHora);
    const ahora = new Date();
    if (fecha.getTime() <= ahora.getTime() + MS_1_HORA) {
      return res.status(400).json(err('La fecha debe ser al menos 1 hora en el futuro', 'VALIDATION_ERROR'));
    }
    if (fecha.getTime() > ahora.getTime() + MS_1_ANIO) {
      return res.status(400).json(err('La fecha no puede ser mayor a 1 año en el futuro', 'VALIDATION_ERROR'));
    }

    const reunion = await reunionRepo.findById(reunionId);
    if (!reunion) {
      return res.status(404).json(err('Reunión no encontrada', 'NOT_FOUND'));
    }
    if (reunion.estado !== 'pendiente') {
      return res.status(400).json(err(`No se pueden agregar opciones a una reunión ${reunion.estado}`, 'INVALID_STATE'));
    }

    const duplicado = await opcionRepo.findOne({ reunionId, fechaHora: fecha });
    if (duplicado) {
      return res.status(409).json(err('Ya existe esa opción de horario en esta reunión', 'CONFLICT'));
    }

    const opcion = await opcionRepo.create({ reunionId, fechaHora: fecha });

    const participantes = await participanteRepo.find({ reunionId });
    const ids = participantes
      .filter(p => String(p.usuarioId) !== String(req.usuarioId))
      .map(p => p.usuarioId);

    if (ids.length > 0) {
      const fechaFormateada = new Date(fecha).toLocaleString('es-MX', {
        dateStyle: 'long', timeStyle: 'short',
      });
      notificarParticipantes(
        ids,
        'recordatorio',
        `Se agregó una nueva opción de horario (${fechaFormateada}) a la reunión "${reunion.titulo}". Por favor responde tu disponibilidad.`,
        reunionId,
      ).catch(e => console.error('[notif] nueva opción error:', e));
    }

    res.status(201).json(ok(opcion));
  } catch (error) {
    next(error);
  }
};

const listarOpciones = async (req, res, next) => {
  try {
    const opciones = await opcionRepo.find({ reunionId: req.params.reunionId }, { fechaHora: 1 });
    res.json(ok(opciones));
  } catch (error) {
    next(error);
  }
};

const eliminarOpcion = async (req, res, next) => {
  try {
    const { reunionId, opcionId } = req.params;

    const opcion = await opcionRepo.findOne({ _id: opcionId, reunionId });
    if (!opcion) {
      return res.status(404).json(err('Opción no encontrada', 'NOT_FOUND'));
    }

    const afectados = await disponibilidadRepo.find({ opcionHorarioId: opcionId });
    if (afectados.length > 0) {
      const reunion = await reunionRepo.findById(reunionId);
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

    await disponibilidadRepo.deleteMany({ opcionHorarioId: opcionId });
    await opcionRepo.deleteDoc(opcion);
    res.json(ok({ mensaje: 'Opción eliminada' }));
  } catch (error) {
    next(error);
  }
};

module.exports = { agregarOpcion, listarOpciones, eliminarOpcion };
