const express = require('express');
const router = express.Router();
const serviceActivo = require('../services/serviceActivo');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');
const {
  validarCreacion,
  validarActualizacion,
  validarCambioEstado,
} = require('../middlewares/validarActivo');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Lectura: cualquier rol autenticado
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

// Escritura: solo SUPERVISOR o COORDINADOR
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

// Cambio de estado: SUPERVISOR o COORDINADOR
// Excepción: FUERA_DE_SERVICIO → OPERATIVO solo COORDINADOR (validado en el servicio)
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