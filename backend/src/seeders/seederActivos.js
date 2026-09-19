const Activo = require('../models/modelActivo');

async function seederActivos() {
  const count = await Activo.count();
  if (count > 0) {
    console.log('Activos ya existen, no se ejecuta el seeder');
    return;
  }

  await Activo.bulkCreate([
    {
      codigo: 'PMV-001',
      nombre: 'Panel Norte 1',
      tipo: 'PMV',
      ubicacion: 'Km 15 corredor norte',
      corredorVial: 'Corredor Norte',
      estado: 'OPERATIVO',
      fechaInstalacion: '2023-01-15',
    },
    {
      codigo: 'CCTV-001',
      nombre: 'Cámara Sur 1',
      tipo: 'CCTV',
      ubicacion: 'Km 8 corredor sur',
      corredorVial: 'Corredor Sur',
      estado: 'OPERATIVO',
      fechaInstalacion: '2023-03-20',
    },
    {
      codigo: 'EST-001',
      nombre: 'Estación Meteorológica Oriente',
      tipo: 'ESTACION_METEOROLOGICA',
      ubicacion: 'Km 22 corredor oriente',
      corredorVial: 'Corredor Oriente',
      estado: 'EN_MANTENIMIENTO',
      fechaInstalacion: '2023-06-10',
    },
    {
      codigo: 'SEN-001',
      nombre: 'Sensor de Tráfico Occidente',
      tipo: 'SENSOR_TRAFICO',
      ubicacion: 'Km 5 corredor occidente',
      corredorVial: 'Corredor Occidente',
      estado: 'OPERATIVO',
      fechaInstalacion: '2023-09-01',
    },
    {
      codigo: 'AFO-001',
      nombre: 'Aforador Norte 2',
      tipo: 'AFORADOR',
      ubicacion: 'Km 30 corredor norte',
      corredorVial: 'Corredor Norte',
      estado: 'FUERA_DE_SERVICIO',
      fechaInstalacion: '2022-11-05',
    },
  ]);

  console.log('Seeder de activos ejecutado correctamente');
}

module.exports = seederActivos;