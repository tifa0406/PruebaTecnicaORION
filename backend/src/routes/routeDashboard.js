const express = require('express');
const router = express.Router();
const serviceDashboard = require('../services/serviceDashboard');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['SUPERVISOR', 'COORDINADOR']));

router.get('/', async (req, res, next) => {
  try {
    const indicadores = await serviceDashboard.obtenerIndicadores();
    res.json(indicadores);
  } catch (error) {
    next(error);
  }
});

module.exports = router;