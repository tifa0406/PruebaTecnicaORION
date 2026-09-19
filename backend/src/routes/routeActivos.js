const express = require('express');
const router = express.Router();
const serviceActivo = require('../services/serviceActivo');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');
const {
  validarCreacion,
  validarActualizacion,
  validarCambioEstado,
} = require('../middlewares/validarActivo');

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const resultado = await serviceActivo.listar(req.query);
    res.json(resultado);
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

router.post(
  '/',
  roleMiddleware(['SUPERVISOR', 'COORDINADOR']),
  validarCreacion,
  async (req, res, next) => {
    try {
      const nuevo = await serviceActivo.crear(req.body);
      res.status(201).json(nuevo);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  roleMiddleware(['SUPERVISOR', 'COORDINADOR']),
  validarActualizacion,
  async (req, res, next) => {
    try {
      const activo = await serviceActivo.actualizar(req.params.id, req.body);
      res.json(activo);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id/estado',
  roleMiddleware(['SUPERVISOR', 'COORDINADOR']),
  validarCambioEstado,
  async (req, res, next) => {
    try {
      const activo = await serviceActivo.cambiarEstado(
        req.params.id,
        req.body.estado,
        req.usuario.rol
      );
      res.json(activo);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;