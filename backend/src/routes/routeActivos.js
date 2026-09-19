const express = require('express');
const router = express.Router();
const serviceActivo = require('../services/serviceActivo');
const {
  validarCreacion,
  validarActualizacion,
  validarCambioEstado,
} = require('../middlewares/validarActivo');

router.get('/', async (req, res, next) => {
  try {
    const activos = await serviceActivo.listar(req.query);
    res.json({ data: activos, total: activos.length });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const activo = await serviceActivo.obtenerPorId(req.params.id);
    res.json(activo);
  } catch (error) {
    next(error);
  }
});

router.post('/', validarCreacion, async (req, res, next) => {
  try {
    const nuevo = await serviceActivo.crear(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validarActualizacion, async (req, res, next) => {
  try {
    const activo = await serviceActivo.actualizar(req.params.id, req.body);
    res.json(activo);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/estado', validarCambioEstado, async (req, res, next) => {
  try {
    const activo = await serviceActivo.cambiarEstado(req.params.id, req.body.estado);
    res.json(activo);
  } catch (error) {
    next(error);
  }
});

module.exports = router;