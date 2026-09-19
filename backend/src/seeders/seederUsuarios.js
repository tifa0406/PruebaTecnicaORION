const bcrypt = require('bcryptjs');
const Usuario = require('../models/modelUsuario');

async function seederUsuarios() {
  const count = await Usuario.count();
  if (count > 0) {
    console.log('Usuarios ya existen, no se ejecuta el seeder');
    return;
  }

  const hash = await bcrypt.hash('123456', 10);

  await Usuario.bulkCreate([
    {
      email: 'supervisor@orion.com',
      password: hash,
      nombre: 'Supervisor Demo',
      rol: 'SUPERVISOR',
    },
    {
      email: 'coordinador@orion.com',
      password: hash,
      nombre: 'Coordinador Demo',
      rol: 'COORDINADOR',
    },
    {
      email: 'tecnico@orion.com',
      password: hash,
      nombre: 'Técnico Demo',
      rol: 'TECNICO',
    },
  ]);

  console.log('Seeder de usuarios ejecutado correctamente');
}

module.exports = seederUsuarios;