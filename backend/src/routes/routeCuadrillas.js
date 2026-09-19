const express = require('express');
const router = express.Router();
const serviceCuadrilla = require('../services/serviceCuadrilla');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const resultado = await serviceCuadrilla.listar(req.query);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const cuadrilla = await serviceCuadrilla.obtenerPorId(req.params.id);
    res.json(cuadrilla);
  } catch (error) {
    next(error);
  }
});

router.post('/', roleMiddleware(['SUPERVISOR', 'COORDINADOR']), async (req, res, next) => {
  try {
    const nueva = await serviceCuadrilla.crear(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', roleMiddleware(['SUPERVISOR', 'COORDINADOR']), async (req, res, next) => {
  try {
    const cuadrilla = await serviceCuadrilla.actualizar(req.params.id, req.body);
    res.json(cuadrilla);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/estado', roleMiddleware(['SUPERVISOR', 'COORDINADOR']), async (req, res, next) => {
  try {
    const cuadrilla = await serviceCuadrilla.cambiarEstado(req.params.id, req.body.estado);
    res.json(cuadrilla);
  } catch (error) {
    next(error);
  }
});

module.exports = router;