const express = require('express');
const router = express.Router();
const serviceOrdenTrabajo = require('../services/serviceOrdenTrabajo');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const resultado = await serviceOrdenTrabajo.listar(req.query);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const orden = await serviceOrdenTrabajo.obtenerPorId(req.params.id);
    res.json(orden);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  roleMiddleware(['SUPERVISOR', 'COORDINADOR']),
  async (req, res, next) => {
    try {
      const nueva = await serviceOrdenTrabajo.crear(req.body);
      res.status(201).json(nueva);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  roleMiddleware(['SUPERVISOR', 'COORDINADOR']),
  async (req, res, next) => {
    try {
      const orden = await serviceOrdenTrabajo.actualizar(req.params.id, req.body);
      res.json(orden);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id/estado',
  roleMiddleware(['SUPERVISOR', 'COORDINADOR']),
  async (req, res, next) => {
    try {
      const orden = await serviceOrdenTrabajo.cambiarEstado(
        req.params.id,
        req.body.estado,
        req.usuario.rol,
        req.body
      );
      res.json(orden);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;