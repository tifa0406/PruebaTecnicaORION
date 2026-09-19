const OrdenTrabajo = require('../models/modelOrdenTrabajo');
const Activo = require('../models/modelActivo');

async function seederOrdenes() {
  const count = await OrdenTrabajo.count();
  if (count > 0) {
    console.log('Órdenes ya existen, no se ejecuta el seeder');
    return;
  }

  const activo1 = await Activo.findOne({ where: { codigo: 'PMV-001' } });
  const activo2 = await Activo.findOne({ where: { codigo: 'CCTV-001' } });

  if (!activo1 || !activo2) {
    console.log('No hay activos para asociar órdenes');
    return;
  }

  await OrdenTrabajo.bulkCreate([
    {
      codigo: 'OT-001',
      tipo: 'PREVENTIVO',
      prioridad: 'MEDIA',
      descripcion: 'Mantenimiento preventivo trimestral',
      activoId: activo1.id,
      estado: 'ABIERTA',
      fechaProgramada: '2024-12-01',
    },
    {
      codigo: 'OT-002',
      tipo: 'CORRECTIVO',
      prioridad: 'ALTA',
      descripcion: 'Reparación de cámara',
      activoId: activo2.id,
      estado: 'ABIERTA',
      fechaProgramada: '2024-12-05',
    },
  ]);

  console.log('Seeder de órdenes ejecutado correctamente');
}

module.exports = seederOrdenes;