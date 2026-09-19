const express = require('express');
const router = express.Router();
const serviceAuth = require('../services/serviceAuth');

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const resultado = await serviceAuth.login(email, password);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

module.exports = router;