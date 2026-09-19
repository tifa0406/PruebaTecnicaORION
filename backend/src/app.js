const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
require('./models/modelActivo');
require('./models/modelUsuario');
require('./models/modelCorredor');
const seederCorredores = require('./seeders/seederCorredores');
const seederUsuarios = require('./seeders/seederUsuarios');
const seederActivos = require('./seeders/seederActivos');
const routeActivos = require('./routes/routeActivos');
const routeAuth = require('./routes/routeAuth');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'orion-backend' });
});

app.use('/api/auth', routeAuth);
app.use('/api/activos', routeActivos);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await sequelize.sync({ alter: true });
    await seederCorredores();
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