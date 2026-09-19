const sequelize = require('../src/config/database');
const Activo = require('../src/models/modelActivo');
const Corredor = require('../src/models/modelCorredor');
const serviceActivo = require('../src/services/serviceActivo');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await Activo.destroy({ where: {}, truncate: true });
  await Corredor.destroy({ where: {}, truncate: true });

  await Corredor.bulkCreate([
    { nombre: 'Corredor Test' },
    { nombre: 'Norte' },
    { nombre: 'Sur' },
  ]);
});

describe('serviceActivo', () => {
  describe('crear', () => {
    test('crea un activo con datos válidos', async () => {
      const activo = await serviceActivo.crear({
        codigo: 'TEST-001',
        nombre: 'Activo Test',
        tipo: 'PMV',
        ubicacion: 'Km 1',
        corredorVial: 'Corredor Test',
        fechaInstalacion: '2024-01-01',
      });
      expect(activo.id).toBeDefined();
      expect(activo.codigo).toBe('TEST-001');
      expect(activo.estado).toBe('OPERATIVO');
    });

    test('rechaza crear dos activos con el mismo código', async () => {
      await serviceActivo.crear({
        codigo: 'DUP-001',
        nombre: 'Activo 1',
        tipo: 'PMV',
        ubicacion: 'Km 1',
        corredorVial: 'Norte',
        fechaInstalacion: '2024-01-01',
      });

      await expect(
        serviceActivo.crear({
          codigo: 'DUP-001',
          nombre: 'Activo 2',
          tipo: 'CCTV',
          ubicacion: 'Km 2',
          corredorVial: 'Sur',
          fechaInstalacion: '2024-02-01',
        })
      ).rejects.toMatchObject({ code: 'DUPLICATE_CODE', status: 409 });
    });

    test('rechaza crear activo con corredor inexistente', async () => {
      await expect(
        serviceActivo.crear({
          codigo: 'NOCOR-001',
          nombre: 'Activo sin corredor',
          tipo: 'PMV',
          ubicacion: 'Km 1',
          corredorVial: 'Corredor Inexistente',
          fechaInstalacion: '2024-01-01',
        })
      ).rejects.toMatchObject({ code: 'INVALID_CORREDOR', status: 400 });
    });
  });

  describe('obtenerPorId', () => {
    test('devuelve un activo existente', async () => {
      const creado = await serviceActivo.crear({
        codigo: 'GET-001',
        nombre: 'Activo GET',
        tipo: 'CCTV',
        ubicacion: 'Km 3',
        corredorVial: 'Norte',
        fechaInstalacion: '2024-01-01',
      });
      const activo = await serviceActivo.obtenerPorId(creado.id);
      expect(activo.codigo).toBe('GET-001');
    });

    test('lanza error 404 si no existe', async () => {
      await expect(serviceActivo.obtenerPorId(99999)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        status: 404,
      });
    });
  });

  describe('cambiarEstado', () => {
    test('permite OPERATIVO → EN_MANTENIMIENTO', async () => {
      const activo = await serviceActivo.crear({
        codigo: 'EST-001',
        nombre: 'Activo Estado',
        tipo: 'PMV',
        ubicacion: 'Km 1',
        corredorVial: 'Norte',
        fechaInstalacion: '2024-01-01',
      });
      const actualizado = await serviceActivo.cambiarEstado(
        activo.id,
        'EN_MANTENIMIENTO',
        'SUPERVISOR'
      );
      expect(actualizado.estado).toBe('EN_MANTENIMIENTO');
    });

    test('rechaza transición inválida', async () => {
      const activo = await serviceActivo.crear({
        codigo: 'EST-002',
        nombre: 'Activo Estado 2',
        tipo: 'CCTV',
        ubicacion: 'Km 2',
        corredorVial: 'Sur',
        fechaInstalacion: '2024-01-01',
      });
      await serviceActivo.cambiarEstado(activo.id, 'EN_MANTENIMIENTO', 'SUPERVISOR');
      await serviceActivo.cambiarEstado(activo.id, 'FUERA_DE_SERVICIO', 'SUPERVISOR');

      await expect(
        serviceActivo.cambiarEstado(activo.id, 'EN_MANTENIMIENTO', 'SUPERVISOR')
      ).rejects.toMatchObject({ code: 'INVALID_TRANSITION', status: 409 });
    });

    test('solo COORDINADOR puede reactivar desde FUERA_DE_SERVICIO', async () => {
      const activo = await serviceActivo.crear({
        codigo: 'EST-003',
        nombre: 'Activo 3',
        tipo: 'PMV',
        ubicacion: 'Km 3',
        corredorVial: 'Norte',
        fechaInstalacion: '2024-01-01',
      });
      await serviceActivo.cambiarEstado(activo.id, 'FUERA_DE_SERVICIO', 'SUPERVISOR');

      await expect(
        serviceActivo.cambiarEstado(activo.id, 'OPERATIVO', 'SUPERVISOR')
      ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });

      const reactivado = await serviceActivo.cambiarEstado(
        activo.id,
        'OPERATIVO',
        'COORDINADOR'
      );
      expect(reactivado.estado).toBe('OPERATIVO');
    });
  });

  describe('actualizar', () => {
    test('bloquea reasignación de corredor si está fuera de servicio', async () => {
      const activo = await serviceActivo.crear({
        codigo: 'UPD-001',
        nombre: 'Activo Upd',
        tipo: 'PMV',
        ubicacion: 'Km 1',
        corredorVial: 'Norte',
        fechaInstalacion: '2024-01-01',
      });
      await serviceActivo.cambiarEstado(activo.id, 'FUERA_DE_SERVICIO', 'SUPERVISOR');

      await expect(
        serviceActivo.actualizar(activo.id, { corredorVial: 'Sur' })
      ).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
    });
  });
});