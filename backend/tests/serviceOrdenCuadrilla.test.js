const sequelize = require('../src/config/database');
const Activo = require('../src/models/modelActivo');
const Corredor = require('../src/models/modelCorredor');
const OrdenTrabajo = require('../src/models/modelOrdenTrabajo');
const Cuadrilla = require('../src/models/modelCuadrilla');
const OrdenCuadrilla = require('../src/models/modelOrdenCuadrilla');
const serviceOrdenTrabajo = require('../src/services/serviceOrdenTrabajo');

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

  await Corredor.bulkCreate([{ nombre: 'Corredor Norte' }]);
});

function fechaFutura(dias = 30) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

async function setup() {
  const activo = await Activo.create({
    codigo: 'ACT-001',
    nombre: 'Activo Test',
    tipo: 'PMV',
    ubicacion: 'Km 1',
    corredorVial: 'Corredor Norte',
    estado: 'OPERATIVO',
    fechaInstalacion: '2024-01-01',
  });

  const orden = await OrdenTrabajo.create({
    codigo: 'OT-001',
    tipo: 'PREVENTIVO',
    prioridad: 'ALTA',
    descripcion: 'Test',
    activoId: activo.id,
    estado: 'ABIERTA',
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

  return { activo, orden, cuadrilla };
}

describe('asignarCuadrilla', () => {
  test('asigna una cuadrilla a una orden ABIERTA', async () => {
    const { orden, cuadrilla } = await setup();
    const asignacion = await serviceOrdenTrabajo.asignarCuadrilla(
      orden.id,
      cuadrilla.id,
      fechaFutura(5),
      fechaFutura(10)
    );
    expect(asignacion.id).toBeDefined();
    expect(asignacion.ordenId).toBe(orden.id);
    expect(asignacion.cuadrillaId).toBe(cuadrilla.id);
  });

  test('cambia la orden a ASIGNADA y la cuadrilla a ASIGNADA', async () => {
    const { orden, cuadrilla } = await setup();
    await serviceOrdenTrabajo.asignarCuadrilla(
      orden.id,
      cuadrilla.id,
      fechaFutura(5),
      fechaFutura(10)
    );
    await orden.reload();
    await cuadrilla.reload();
    expect(orden.estado).toBe('ASIGNADA');
    expect(cuadrilla.estado).toBe('ASIGNADA');
  });

  test('rechaza asignar si la orden no está ABIERTA', async () => {
    const { orden, cuadrilla } = await setup();
    await orden.update({ estado: 'CERRADA' });
    await expect(
      serviceOrdenTrabajo.asignarCuadrilla(orden.id, cuadrilla.id, fechaFutura(5), fechaFutura(10))
    ).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
  });

  test('rechaza asignar cuadrilla INACTIVA', async () => {
    const { orden, cuadrilla } = await setup();
    await cuadrilla.update({ estado: 'INACTIVA' });
    await expect(
      serviceOrdenTrabajo.asignarCuadrilla(orden.id, cuadrilla.id, fechaFutura(5), fechaFutura(10))
    ).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
  });

  test('rechaza cuadrilla inexistente', async () => {
    const { orden } = await setup();
    await expect(
      serviceOrdenTrabajo.asignarCuadrilla(orden.id, 99999, fechaFutura(5), fechaFutura(10))
    ).rejects.toMatchObject({ code: 'INVALID_CUADRILLA', status: 400 });
  });

  test('rechaza solapamiento de fechas', async () => {
    const { orden, cuadrilla } = await setup();
    await serviceOrdenTrabajo.asignarCuadrilla(
      orden.id,
      cuadrilla.id,
      fechaFutura(5),
      fechaFutura(10)
    );

    const activo2 = await Activo.create({
      codigo: 'ACT-002',
      nombre: 'Activo 2',
      tipo: 'CCTV',
      ubicacion: 'Km 2',
      corredorVial: 'Corredor Norte',
      estado: 'OPERATIVO',
      fechaInstalacion: '2024-01-01',
    });

    const orden2 = await OrdenTrabajo.create({
      codigo: 'OT-002',
      tipo: 'CORRECTIVO',
      prioridad: 'MEDIA',
      descripcion: 'Test 2',
      activoId: activo2.id,
      estado: 'ABIERTA',
      fechaProgramada: fechaFutura(15),
    });

    await expect(
      serviceOrdenTrabajo.asignarCuadrilla(
        orden2.id,
        cuadrilla.id,
        fechaFutura(7),
        fechaFutura(12)
      )
    ).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
  });

  test('permite asignar con fechas que no se solapan', async () => {
    const { orden, cuadrilla } = await setup();
    await serviceOrdenTrabajo.asignarCuadrilla(
      orden.id,
      cuadrilla.id,
      fechaFutura(5),
      fechaFutura(10)
    );

    const activo2 = await Activo.create({
      codigo: 'ACT-003',
      nombre: 'Activo 3',
      tipo: 'PMV',
      ubicacion: 'Km 3',
      corredorVial: 'Corredor Norte',
      estado: 'OPERATIVO',
      fechaInstalacion: '2024-01-01',
    });

    const orden2 = await OrdenTrabajo.create({
      codigo: 'OT-003',
      tipo: 'PREVENTIVO',
      prioridad: 'BAJA',
      descripcion: 'Test 3',
      activoId: activo2.id,
      estado: 'ABIERTA',
      fechaProgramada: fechaFutura(30),
    });

    const asignacion = await serviceOrdenTrabajo.asignarCuadrilla(
      orden2.id,
      cuadrilla.id,
      fechaFutura(15),
      fechaFutura(20)
    );
    expect(asignacion.id).toBeDefined();
  });

  test('rechaza fecha inicio posterior a fecha fin', async () => {
    const { orden, cuadrilla } = await setup();
    await expect(
      serviceOrdenTrabajo.asignarCuadrilla(
        orden.id,
        cuadrilla.id,
        fechaFutura(20),
        fechaFutura(10)
      )
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
  });
});

describe('desasignarCuadrilla', () => {
  test('desasigna y libera la cuadrilla', async () => {
    const { orden, cuadrilla } = await setup();
    await serviceOrdenTrabajo.asignarCuadrilla(
      orden.id,
      cuadrilla.id,
      fechaFutura(5),
      fechaFutura(10)
    );

    await serviceOrdenTrabajo.desasignarCuadrilla(orden.id, cuadrilla.id);

    await orden.reload();
    await cuadrilla.reload();
    expect(orden.estado).toBe('ABIERTA');
    expect(cuadrilla.estado).toBe('DISPONIBLE');
  });

  test('rechaza desasignar si la orden no está ASIGNADA', async () => {
    const { orden, cuadrilla } = await setup();
    await expect(
      serviceOrdenTrabajo.desasignarCuadrilla(orden.id, cuadrilla.id)
    ).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
  });

  test('rechaza desasignar asignación inexistente', async () => {
    const { orden, cuadrilla } = await setup();
    await orden.update({ estado: 'ASIGNADA' });
    await expect(
      serviceOrdenTrabajo.desasignarCuadrilla(orden.id, cuadrilla.id)
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });
});