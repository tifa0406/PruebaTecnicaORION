const Corredor = require('../models/modelCorredor');

async function seederCorredores() {
  const count = await Corredor.count();
  if (count > 0) {
    console.log('Corredores ya existen, no se ejecuta el seeder');
    return;
  }

  await Corredor.bulkCreate([
    { nombre: 'Corredor Norte' },
    { nombre: 'Corredor Sur' },
    { nombre: 'Corredor Oriente' },
    { nombre: 'Corredor Occidente' },
  ]);

  console.log('Seeder de corredores ejecutado correctamente');
}

module.exports = seederCorredores;