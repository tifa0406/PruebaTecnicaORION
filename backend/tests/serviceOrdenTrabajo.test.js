const sequelize = require('../src/config/database');
const Activo = require('../src/models/modelActivo');
const Corredor = require('../src/models/modelCorredor');
const OrdenTrabajo = require('../src/models/modelOrdenTrabajo');
const serviceOrdenTrabajo = require('../src/services/serviceOrdenTrabajo');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await OrdenTrabajo.destroy({ where: {}, truncate: true });
  await Activo.destroy({ where: {}, truncate: true });
  await Corredor.destroy({ where: {}, truncate: true });

  await Corredor.bulkCreate([
    { nombre: 'Corredor Norte' },
    { nombre: 'Corredor Sur' },
  ]);
});

async function crearActivo(codigo = 'ACT-001', estado = 'OPERATIVO') {
  return Activo.create({
    codigo,
    nombre: 'Activo Test',
    tipo: 'PMV',
    ubicacion: 'Km 1',
    corredorVial: 'Corredor Norte',
    estado,
    fechaInstalacion: '2024-01-01',
  });
}

function fechaFutura(dias = 30) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

describe('serviceOrdenTrabajo', () => {
  describe('crear', () => {
    test('crea una orden con datos válidos', async () => {
      const activo = await crearActivo();
      const orden = await serviceOrdenTrabajo.crear({
        codigo: 'OT-001',
        tipo: 'PREVENTIVO',
        prioridad: 'ALTA',
        descripcion: 'Test',
        activoId: activo.id,
        fechaProgramada: fechaFutura(10),
      });
      expect(orden.id).toBeDefined();
      expect(orden.estado).toBe('ABIERTA');
    });

    test('cambia el activo a EN_MANTENIMIENTO si estaba OPERATIVO', async () => {
      const activo = await crearActivo();
      await serviceOrdenTrabajo.crear({
        codigo: 'OT-002',
        tipo: 'PREVENTIVO',
        prioridad: 'MEDIA',
        descripcion: 'Test sincronización',
        activoId: activo.id,
        fechaProgramada: fechaFutura(5),
      });
      await activo.reload();
      expect(activo.estado).toBe('EN_MANTENIMIENTO');
    });

    test('rechaza tipo inválido', async () => {
      const activo = await crearActivo();
      await expect(
        serviceOrdenTrabajo.crear({
          codigo: 'OT-003',
          tipo: 'INVALIDO',
          prioridad: 'ALTA',
          descripcion: 'Test',
          activoId: activo.id,
          fechaProgramada: fechaFutura(5),
        })
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    });

    test('rechaza prioridad inválida', async () => {
      const activo = await crearActivo();
      await expect(
        serviceOrdenTrabajo.crear({
          codigo: 'OT-004',
          tipo: 'PREVENTIVO',
          prioridad: 'URGENTE',
          descripcion: 'Test',
          activoId: activo.id,
          fechaProgramada: fechaFutura(5),
        })
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    });

    test('rechaza activo inexistente', async () => {
      await expect(
        serviceOrdenTrabajo.crear({
          codigo: 'OT-005',
          tipo: 'PREVENTIVO',
          prioridad: 'ALTA',
          descripcion: 'Test',
          activoId: 99999,
          fechaProgramada: fechaFutura(5),
        })
      ).rejects.toMatchObject({ code: 'INVALID_ACTIVO', status: 400 });
    });

    test('rechaza activo fuera de servicio', async () => {
      const activo = await crearActivo('ACT-002', 'FUERA_DE_SERVICIO');
      await expect(
        serviceOrdenTrabajo.crear({
          codigo: 'OT-006',
          tipo: 'PREVENTIVO',
          prioridad: 'ALTA',
          descripcion: 'Test',
          activoId: activo.id,
          fechaProgramada: fechaFutura(5),
        })
      ).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
    });

    test('rechaza fecha programada en el pasado', async () => {
      const activo = await crearActivo();
      await expect(
        serviceOrdenTrabajo.crear({
          codigo: 'OT-007',
          tipo: 'PREVENTIVO',
          prioridad: 'ALTA',
          descripcion: 'Test',
          activoId: activo.id,
          fechaProgramada: '2020-01-01',
        })
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    });

    test('rechaza código duplicado', async () => {
      const activo = await crearActivo();
      await serviceOrdenTrabajo.crear({
        codigo: 'OT-008',
        tipo: 'PREVENTIVO',
        prioridad: 'ALTA',
        descripcion: 'Test',
        activoId: activo.id,
        fechaProgramada: fechaFutura(5),
      });

      await expect(
        serviceOrdenTrabajo.crear({
          codigo: 'OT-008',
          tipo: 'CORRECTIVO',
          prioridad: 'BAJA',
          descripcion: 'Otra',
          activoId: activo.id,
          fechaProgramada: fechaFutura(10),
        })
      ).rejects.toMatchObject({ code: 'DUPLICATE_CODE', status: 409 });
    });
  });

  describe('obtenerPorId', () => {
    test('devuelve una orden existente', async () => {
      const activo = await crearActivo();
      const creada = await serviceOrdenTrabajo.crear({
        codigo: 'OT-GET',
        tipo: 'PREVENTIVO',
        prioridad: 'ALTA',
        descripcion: 'Test',
        activoId: activo.id,
        fechaProgramada: fechaFutura(5),
      });
      const orden = await serviceOrdenTrabajo.obtenerPorId(creada.id);
      expect(orden.codigo).toBe('OT-GET');
    });

    test('lanza 404 si no existe', async () => {
      await expect(serviceOrdenTrabajo.obtenerPorId(99999)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        status: 404,
      });
    });
  });

  describe('cambiarEstado', () => {
    async function setupOrden() {
      const activo = await crearActivo();
      return serviceOrdenTrabajo.crear({
        codigo: `OT-EST-${Date.now()}`,
        tipo: 'PREVENTIVO',
        prioridad: 'ALTA',
        descripcion: 'Test',
        activoId: activo.id,
        fechaProgramada: fechaFutura(5),
      });
    }

    test('rechaza transición inválida (ABIERTA → EN_EJECUCION)', async () => {
      const orden = await setupOrden();
      await expect(
        serviceOrdenTrabajo.cambiarEstado(orden.id, 'EN_EJECUCION', 'SUPERVISOR')
      ).rejects.toMatchObject({ code: 'INVALID_TRANSITION', status: 409 });
    });

    test('permite ABIERTA → CANCELADA con motivo', async () => {
      const orden = await setupOrden();
      const actualizada = await serviceOrdenTrabajo.cambiarEstado(
        orden.id,
        'CANCELADA',
        'SUPERVISOR',
        { motivoCancelacion: 'No se necesita' }
      );
      expect(actualizada.estado).toBe('CANCELADA');
      expect(actualizada.motivoCancelacion).toBe('No se necesita');
    });

    test('rechaza cancelar sin motivo', async () => {
      const orden = await setupOrden();
      await expect(
        serviceOrdenTrabajo.cambiarEstado(orden.id, 'CANCELADA', 'SUPERVISOR', {})
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    });

    test('sincroniza el activo a OPERATIVO al cancelar la última orden activa', async () => {
      const activo = await crearActivo('ACT-SYNC');
      const orden = await serviceOrdenTrabajo.crear({
        codigo: 'OT-SYNC',
        tipo: 'PREVENTIVO',
        prioridad: 'ALTA',
        descripcion: 'Test',
        activoId: activo.id,
        fechaProgramada: fechaFutura(5),
      });

      await activo.reload();
      expect(activo.estado).toBe('EN_MANTENIMIENTO');

      await serviceOrdenTrabajo.cambiarEstado(
        orden.id,
        'CANCELADA',
        'SUPERVISOR',
        { motivoCancelacion: 'Prueba' }
      );

      await activo.reload();
      expect(activo.estado).toBe('OPERATIVO');
    });

    test('solo COORDINADOR puede reabrir una orden CERRADA', async () => {
      const activo = await crearActivo('ACT-REABRIR');
      const orden = await serviceOrdenTrabajo.crear({
        codigo: 'OT-REABRIR',
        tipo: 'PREVENTIVO',
        prioridad: 'ALTA',
        descripcion: 'Test',
        activoId: activo.id,
        fechaProgramada: fechaFutura(5),
      });

      await orden.update({ estado: 'CERRADA' });

      await expect(
        serviceOrdenTrabajo.cambiarEstado(orden.id, 'ABIERTA', 'SUPERVISOR')
      ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });

      const reabierta = await serviceOrdenTrabajo.cambiarEstado(
        orden.id,
        'ABIERTA',
        'COORDINADOR'
      );
      expect(reabierta.estado).toBe('ABIERTA');
    });
  });

  describe('actualizar', () => {
    test('actualiza una orden en estado ABIERTA', async () => {
      const activo = await crearActivo('ACT-UPD');
      const orden = await serviceOrdenTrabajo.crear({
        codigo: 'OT-UPD-001',
        tipo: 'PREVENTIVO',
        prioridad: 'ALTA',
        descripcion: 'Original',
        activoId: activo.id,
        fechaProgramada: fechaFutura(5),
      });

      const actualizada = await serviceOrdenTrabajo.actualizar(orden.id, {
        descripcion: 'Modificada',
        prioridad: 'MEDIA',
      });

      expect(actualizada.descripcion).toBe('Modificada');
      expect(actualizada.prioridad).toBe('MEDIA');
    });

    test('rechaza actualizar una orden que no está ABIERTA', async () => {
      const activo = await crearActivo('ACT-UPD-2');
      const orden = await serviceOrdenTrabajo.crear({
        codigo: 'OT-UPD-002',
        tipo: 'PREVENTIVO',
        prioridad: 'ALTA',
        descripcion: 'Test',
        activoId: activo.id,
        fechaProgramada: fechaFutura(5),
      });

      await orden.update({ estado: 'CANCELADA' });

      await expect(
        serviceOrdenTrabajo.actualizar(orden.id, { descripcion: 'X' })
      ).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
    });

    test('rechaza actualizar una orden con tipo inválido', async () => {
      const activo = await crearActivo('ACT-UPD-3');
      const orden = await serviceOrdenTrabajo.crear({
        codigo: 'OT-UPD-003',
        tipo: 'PREVENTIVO',
        prioridad: 'ALTA',
        descripcion: 'Test',
        activoId: activo.id,
        fechaProgramada: fechaFutura(5),
      });

      await expect(
        serviceOrdenTrabajo.actualizar(orden.id, { tipo: 'INVALIDO' })
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    });

    test('rechaza actualizar con código duplicado', async () => {
      const activo = await crearActivo('ACT-UPD-4');
      await serviceOrdenTrabajo.crear({
        codigo: 'OT-UNICO-1',
        tipo: 'PREVENTIVO',
        prioridad: 'ALTA',
        descripcion: 'Test 1',
        activoId: activo.id,
        fechaProgramada: fechaFutura(5),
      });
      const orden2 = await serviceOrdenTrabajo.crear({
        codigo: 'OT-UNICO-2',
        tipo: 'PREVENTIVO',
        prioridad: 'ALTA',
        descripcion: 'Test 2',
        activoId: activo.id,
        fechaProgramada: fechaFutura(5),
      });

      await expect(
        serviceOrdenTrabajo.actualizar(orden2.id, { codigo: 'OT-UNICO-1' })
      ).rejects.toMatchObject({ code: 'DUPLICATE_CODE', status: 409 });
    });

    test('flujo completo: crear → ASIGNADA → EN_EJECUCION → CERRADA', async () => {
      const activo = await crearActivo('ACT-FLUJO');
      const orden = await serviceOrdenTrabajo.crear({
        codigo: 'OT-FLUJO',
        tipo: 'PREVENTIVO',
        prioridad: 'ALTA',
        descripcion: 'Test flujo',
        activoId: activo.id,
        fechaProgramada: fechaFutura(5),
      });

      await serviceOrdenTrabajo.cambiarEstado(orden.id, 'ASIGNADA', 'SUPERVISOR');
      await serviceOrdenTrabajo.cambiarEstado(orden.id, 'EN_EJECUCION', 'SUPERVISOR');
      const cerrada = await serviceOrdenTrabajo.cambiarEstado(
        orden.id,
        'CERRADA',
        'SUPERVISOR',
        { observacionCierre: 'Trabajo terminado' }
      );

      expect(cerrada.estado).toBe('CERRADA');
      expect(cerrada.observacionCierre).toBe('Trabajo terminado');
      expect(cerrada.fechaCierre).toBeDefined();
    });

    test('rechaza cerrar sin observación', async () => {
      const activo = await crearActivo('ACT-CIERRE');
      const orden = await serviceOrdenTrabajo.crear({
        codigo: 'OT-CIERRE',
        tipo: 'PREVENTIVO',
        prioridad: 'ALTA',
        descripcion: 'Test',
        activoId: activo.id,
        fechaProgramada: fechaFutura(5),
      });

      await serviceOrdenTrabajo.cambiarEstado(orden.id, 'ASIGNADA', 'SUPERVISOR');
      await serviceOrdenTrabajo.cambiarEstado(orden.id, 'EN_EJECUCION', 'SUPERVISOR');

      await expect(
        serviceOrdenTrabajo.cambiarEstado(orden.id, 'CERRADA', 'SUPERVISOR', {})
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    });
  });
});