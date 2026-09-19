const Cuadrilla = require('../models/modelCuadrilla');

async function seederCuadrillas() {
  const count = await Cuadrilla.count();
  if (count > 0) {
    console.log('Cuadrillas ya existen, no se ejecuta el seeder');
    return;
  }

  await Cuadrilla.bulkCreate([
    {
      codigo: 'CUA-001',
      nombre: 'Cuadrilla Eléctrica Norte',
      especialidad: 'ELECTRICIDAD',
      numeroIntegrantes: 4,
      corredorVial: 'Corredor Norte',
      estado: 'DISPONIBLE',
    },
    {
      codigo: 'CUA-002',
      nombre: 'Cuadrilla Comunicaciones Sur',
      especialidad: 'COMUNICACIONES',
      numeroIntegrantes: 3,
      corredorVial: 'Corredor Sur',
      estado: 'DISPONIBLE',
    },
    {
      codigo: 'CUA-003',
      nombre: 'Cuadrilla Obra Civil Oriente',
      especialidad: 'OBRA_CIVIL',
      numeroIntegrantes: 5,
      corredorVial: 'Corredor Oriente',
      estado: 'DISPONIBLE',
    },
  ]);

  console.log('Seeder de cuadrillas ejecutado correctamente');
}

module.exports = seederCuadrillas;