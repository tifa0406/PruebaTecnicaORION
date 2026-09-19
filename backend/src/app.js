const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const Activo = require('./models/modelActivo');
const seederActivos = require('./seeders/seederActivos');
const routeActivos = require('./routes/routeActivos');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'orion-backend' });
});

// Rutas
app.use('/api/activos', routeActivos);

// Middleware de errores (siempre al final)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await sequelize.sync({ alter: true });
    await seederActivos();
    app.listen(PORT, () => {
      console.log(`Backend escuchando en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
}

start();

module.exports = app;