const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
require('./models/modelActivo');
require('./models/modelUsuario');
require('./models/modelCorredor');
require('./models/modelOrdenTrabajo');
require('./models/modelCuadrilla');
require('./models/modelOrdenCuadrilla');
const seederCorredores = require('./seeders/seederCorredores');
const seederUsuarios = require('./seeders/seederUsuarios');
const seederActivos = require('./seeders/seederActivos');
const seederCuadrillas = require('./seeders/seederCuadrillas');
const seederOrdenes = require('./seeders/seederOrdenes');
const routeActivos = require('./routes/routeActivos');
const routeAuth = require('./routes/routeAuth');
const routeOrdenes = require('./routes/routeOrdenes');
const routeCuadrillas = require('./routes/routeCuadrillas');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'orion-backend' });
});

app.use('/api/auth', routeAuth);
app.use('/api/activos', routeActivos);
app.use('/api/ordenes', routeOrdenes);
app.use('/api/cuadrillas', routeCuadrillas);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await sequelize.sync({ alter: true });
    await seederCorredores();
    await seederUsuarios();
    await seederActivos();
    await seederCuadrillas();
    await seederOrdenes();
    app.listen(PORT, () => {
      console.log(`Backend escuchando en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
}

start();

module.exports = app;