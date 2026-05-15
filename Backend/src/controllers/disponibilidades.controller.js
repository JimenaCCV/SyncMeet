const disponibilidadRepo = require('../repositories/disponibilidad.repository');
const opcionRepo = require('../repositories/opcion.repository');
const { calcularCoincidencias } = require('../services/coincidencias.service');
const { ok, err } = require('../utils/respuesta');

const registrarDisponibilidad = async (req, res, next) => {
  try {
    const { opcionHorarioId, disponible } = req.body;
    const { reunionId } = req.params;

    const opcion = await opcionRepo.findOne({ _id: opcionHorarioId, reunionId });
    if (!opcion) {
      return res.status(404).json(err('Opción de horario no pertenece a esta reunión', 'NOT_FOUND'));
    }

    const disp = await disponibilidadRepo.create({
      reunionId,
      participanteId: req.usuarioId,
      opcionHorarioId,
      disponible,
    });

    res.status(201).json(ok(disp));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json(err('Ya registraste disponibilidad para esta opción', 'CONFLICT'));
    }
    next(error);
  }
};

const actualizarDisponibilidad = async (req, res, next) => {
  try {
    const { disponible } = req.body;
    const { reunionId, disponibilidadId } = req.params;

    const disp = await disponibilidadRepo.findOne({
      _id: disponibilidadId,
      reunionId,
      participanteId: req.usuarioId,
    });

    if (!disp) {
      return res.status(404).json(err('Disponibilidad no encontrada', 'NOT_FOUND'));
    }

    disp.disponible = disponible;
    await disponibilidadRepo.save(disp);
    res.json(ok(disp));
  } catch (error) {
    next(error);
  }
};

// Upsert en bloque: recibe { respuestas: [{ opcionHorarioId, disponible }] }
const registrarDisponibilidadBulk = async (req, res, next) => {
  try {
    const { respuestas } = req.body;
    const { reunionId } = req.params;

    const opcionIds = respuestas.map(r => r.opcionHorarioId);
    const opcionesValidas = await opcionRepo.find({ reunionId, _id: { $in: opcionIds } });
    const opcionesValidasSet = new Set(opcionesValidas.map(o => String(o._id)));

    const respuestasFiltradas = respuestas.filter(r =>
      opcionesValidasSet.has(String(r.opcionHorarioId))
    );

    if (respuestasFiltradas.length === 0) {
      return res.json(ok([]));
    }

    const Disponibilidad = require('../models/Disponibilidad');
    const operaciones = respuestasFiltradas.map(({ opcionHorarioId, disponible }) => ({
      updateOne: {
        filter: { reunionId, participanteId: req.usuarioId, opcionHorarioId },
        update: { $set: { disponible } },
        upsert: true,
      },
    }));

    await Disponibilidad.bulkWrite(operaciones, { ordered: false });

    const results = await disponibilidadRepo.find({
      reunionId,
      participanteId: req.usuarioId,
      opcionHorarioId: { $in: respuestasFiltradas.map(r => r.opcionHorarioId) },
    });

    res.json(ok(results));
  } catch (error) {
    next(error);
  }
};

const obtenerDisponibilidades = async (req, res, next) => {
  try {
    const disponibilidades = await disponibilidadRepo.findWithPopulate(
      { reunionId: req.params.reunionId },
      [
        { path: 'participanteId', select: '-password' },
        { path: 'opcionHorarioId' },
      ],
    );
    res.json(ok(disponibilidades));
  } catch (error) {
    next(error);
  }
};

const obtenerCoincidencias = async (req, res, next) => {
  try {
    const resultado = await calcularCoincidencias(req.params.reunionId);
    const data = resultado.map(c => ({
      opcion: { _id: c.opcion._id, fechaHora: c.opcion.fechaHora },
      cantidad: c.cantidad,
      totalRespondieron: c.totalRespondieron,
      totalParticipantes: c.totalParticipantes,
      pendientes: c.pendientes,
    }));
    res.json(ok(data));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registrarDisponibilidad,
  actualizarDisponibilidad,
  registrarDisponibilidadBulk,
  obtenerDisponibilidades,
  obtenerCoincidencias,
};
