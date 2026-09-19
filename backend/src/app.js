const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const Activo = require('./models/modelActivo');
const Usuario = require('./models/modelUsuario');
const seederActivos = require('./seeders/seederActivos');
const seederUsuarios = require('./seeders/seederUsuarios');
const routeActivos = require('./routes/routeActivos');
const routeAuth = require('./routes/routeAuth');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'orion-backend' });
});

// Rutas públicas
app.use('/api/auth', routeAuth);

// Rutas protegidas
app.use('/api/activos', routeActivos);

// Middleware de errores (siempre al final)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await sequelize.sync({ alter: true });
    await seederUsuarios();
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