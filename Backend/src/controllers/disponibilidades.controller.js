const disponibilidadRepo = require('../repositories/disponibilidad.repository');
const opcionRepo = require('../repositories/opcion.repository');
const { calcularCoincidencias } = require('../services/coincidencias.service');
const { ok, err } = require('../utils/respuesta');

const registrarDisponibilidad = async (req, res, next) => {
  try {
    const { opcionHorarioId, disponible } = req.body;
    const { reunionId } = req.params;

    if (!opcionHorarioId || disponible === undefined) {
      return res.status(400).json(err('opcionHorarioId y disponible son obligatorios', 'VALIDATION_ERROR'));
    }
    if (typeof disponible !== 'boolean') {
      return res.status(400).json(err('disponible debe ser true o false', 'VALIDATION_ERROR'));
    }

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

    if (disponible === undefined) {
      return res.status(400).json(err('disponible es obligatorio', 'VALIDATION_ERROR'));
    }
    if (typeof disponible !== 'boolean') {
      return res.status(400).json(err('disponible debe ser true o false', 'VALIDATION_ERROR'));
    }

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

    if (!Array.isArray(respuestas) || respuestas.length === 0) {
      return res.status(400).json(err('respuestas debe ser un array no vacío', 'VALIDATION_ERROR'));
    }

    for (const r of respuestas) {
      if (!r.opcionHorarioId) {
        return res.status(400).json(err('Cada respuesta requiere opcionHorarioId', 'VALIDATION_ERROR'));
      }
      if (typeof r.disponible !== 'boolean') {
        return res.status(400).json(err('disponible debe ser true o false en cada respuesta', 'VALIDATION_ERROR'));
      }
    }

    const results = [];
    for (const { opcionHorarioId, disponible } of respuestas) {
      const opcion = await opcionRepo.findOne({ _id: opcionHorarioId, reunionId });
      if (!opcion) continue;

      let disp = await disponibilidadRepo.findOne({
        reunionId,
        participanteId: req.usuarioId,
        opcionHorarioId,
      });

      if (disp) {
        disp.disponible = disponible;
        await disponibilidadRepo.save(disp);
      } else {
        disp = await disponibilidadRepo.create({
          reunionId,
          participanteId: req.usuarioId,
          opcionHorarioId,
          disponible,
        });
      }
      results.push(disp);
    }

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
