const sequelize = require('../src/config/database');
const Activo = require('../src/models/modelActivo');
const Corredor = require('../src/models/modelCorredor');
const OrdenTrabajo = require('../src/models/modelOrdenTrabajo');
const Cuadrilla = require('../src/models/modelCuadrilla');
const OrdenCuadrilla = require('../src/models/modelOrdenCuadrilla');
const serviceDashboard = require('../src/services/serviceDashboard');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await OrdenCuadrilla.destroy({ where: {}, truncate: true });
  await OrdenTrabajo.destroy({ where: {}, truncate: true });
  await Cuadrilla.destroy({ where: {}, truncate: true });
  await Activo.destroy({ where: {}, truncate: true });
  await Corredor.destroy({ where: {}, truncate: true });

  await Corredor.bulkCreate([
    { nombre: 'Corredor Norte' },
    { nombre: 'Corredor Sur' },
  ]);
});

function fechaFutura(dias = 30) { 
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

async function setupDatos() {
  const activo1 = await Activo.create({
    codigo: 'ACT-001',
    nombre: 'Activo 1',
    tipo: 'PMV',
    ubicacion: 'Km 1',
    corredorVial: 'Corredor Norte',
    estado: 'OPERATIVO',
    fechaInstalacion: '2024-01-01',
  });

  const activo2 = await Activo.create({
    codigo: 'ACT-002',
    nombre: 'Activo 2',
    tipo: 'CCTV',
    ubicacion: 'Km 2',
    corredorVial: 'Corredor Sur',
    estado: 'OPERATIVO',
    fechaInstalacion: '2024-01-01',
  });

  await Activo.create({
    codigo: 'ACT-003',
    nombre: 'Activo 3',
    tipo: 'PMV',
    ubicacion: 'Km 3',
    corredorVial: 'Corredor Norte',
    estado: 'FUERA_DE_SERVICIO',
    fechaInstalacion: '2024-01-01',
  });

  const orden1 = await OrdenTrabajo.create({
    codigo: 'OT-001',
    tipo: 'PREVENTIVO',
    prioridad: 'ALTA',
    descripcion: 'Test 1',
    activoId: activo1.id,
    estado: 'ABIERTA',
    fechaProgramada: fechaFutura(5),
  });

  await OrdenTrabajo.create({
    codigo: 'OT-002',
    tipo: 'CORRECTIVO',
    prioridad: 'MEDIA',
    descripcion: 'Test 2',
    activoId: activo2.id,
    estado: 'EN_EJECUCION',
    fechaProgramada: fechaFutura(10),
  });

  const cuadrilla = await Cuadrilla.create({
    codigo: 'CUA-001',
    nombre: 'Cuadrilla Test',
    especialidad: 'ELECTRICIDAD',
    numeroIntegrantes: 4,
    corredorVial: 'Corredor Norte',
    estado: 'DISPONIBLE',
  });

  await OrdenCuadrilla.create({
    ordenId: orden1.id,
    cuadrillaId: cuadrilla.id,
    fechaAsignacion: fechaFutura(1),
    fechaInicio: fechaFutura(5),
    fechaFin: fechaFutura(10),
  });

  return { activo1, activo2, orden1, cuadrilla };
}

describe('serviceDashboard', () => {
  describe('obtenerIndicadores', () => {
    test('devuelve todos los indicadores', async () => {
      await setupDatos();
      const ind = await serviceDashboard.obtenerIndicadores();

      expect(ind).toHaveProperty('activosPorEstado');
      expect(ind).toHaveProperty('activosPorTipo');
      expect(ind).toHaveProperty('ordenesPorEstado');
      expect(ind).toHaveProperty('ordenesPorTipo');
      expect(ind).toHaveProperty('ordenesPorPrioridad');
      expect(ind).toHaveProperty('ordenesPorCorredor');
      expect(ind).toHaveProperty('cuadrillasPorEstado');
      expect(ind).toHaveProperty('cargaCuadrillas');
    });

    test('cuenta activos por estado correctamente', async () => {
      await setupDatos();
      const ind = await serviceDashboard.obtenerIndicadores();

      const operativo = ind.activosPorEstado.find((a) => a.valor === 'OPERATIVO');
      const fueraServicio = ind.activosPorEstado.find((a) => a.valor === 'FUERA_DE_SERVICIO');

      expect(operativo.total).toBe(2);
      expect(fueraServicio.total).toBe(1);
    });

    test('cuenta activos por tipo correctamente', async () => {
      await setupDatos();
      const ind = await serviceDashboard.obtenerIndicadores();

      const pmv = ind.activosPorTipo.find((a) => a.valor === 'PMV');
      const cctv = ind.activosPorTipo.find((a) => a.valor === 'CCTV');

      expect(pmv.total).toBe(2);
      expect(cctv.total).toBe(1);
    });

    test('cuenta órdenes por estado correctamente', async () => {
      await setupDatos();
      const ind = await serviceDashboard.obtenerIndicadores();

      const abierta = ind.ordenesPorEstado.find((o) => o.valor === 'ABIERTA');
      const enEjecucion = ind.ordenesPorEstado.find((o) => o.valor === 'EN_EJECUCION');

      expect(abierta.total).toBe(1);
      expect(enEjecucion.total).toBe(1);
    });

    test('cuenta órdenes por tipo correctamente', async () => {
      await setupDatos();
      const ind = await serviceDashboard.obtenerIndicadores();

      const preventivo = ind.ordenesPorTipo.find((o) => o.valor === 'PREVENTIVO');
      const correctivo = ind.ordenesPorTipo.find((o) => o.valor === 'CORRECTIVO');

      expect(preventivo.total).toBe(1);
      expect(correctivo.total).toBe(1);
    });

    test('cuenta órdenes por prioridad correctamente', async () => {
      await setupDatos();
      const ind = await serviceDashboard.obtenerIndicadores();

      const alta = ind.ordenesPorPrioridad.find((o) => o.valor === 'ALTA');
      const media = ind.ordenesPorPrioridad.find((o) => o.valor === 'MEDIA');

      expect(alta.total).toBe(1);
      expect(media.total).toBe(1);
    });

    test('cuenta órdenes activas por corredor', async () => {
      await setupDatos();
      const ind = await serviceDashboard.obtenerIndicadores();

      const norte = ind.ordenesPorCorredor.find((o) => o.valor === 'Corredor Norte');
      const sur = ind.ordenesPorCorredor.find((o) => o.valor === 'Corredor Sur');

      expect(norte.total).toBe(1);
      expect(sur.total).toBe(1);
    });

    test('cuenta cuadrillas por estado correctamente', async () => {
      await setupDatos();
      const ind = await serviceDashboard.obtenerIndicadores();

      const disponible = ind.cuadrillasPorEstado.find((c) => c.valor === 'DISPONIBLE');
      expect(disponible.total).toBe(1);
    });

    test('calcula carga de cuadrillas', async () => {
      await setupDatos();
      const ind = await serviceDashboard.obtenerIndicadores();

      expect(ind.cargaCuadrillas.length).toBe(1);
      expect(ind.cargaCuadrillas[0].codigo).toBe('CUA-001');
      expect(ind.cargaCuadrillas[0].asignaciones).toBe(1);
    });

    test('devuelve arrays vacíos si no hay datos', async () => {
      const ind = await serviceDashboard.obtenerIndicadores();

      expect(ind.activosPorEstado).toEqual([]);
      expect(ind.ordenesPorEstado).toEqual([]);
      expect(ind.cuadrillasPorEstado).toEqual([]);
      expect(ind.cargaCuadrillas).toEqual([]);
    });
  });
});