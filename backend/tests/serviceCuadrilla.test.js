const sequelize = require('../src/config/database');
const Cuadrilla = require('../src/models/modelCuadrilla');
const serviceCuadrilla = require('../src/services/serviceCuadrilla');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await Cuadrilla.destroy({ where: {}, truncate: true });
});

function datosValidos(overrides = {}) {
  return {
    codigo: 'CUA-TEST',
    nombre: 'Cuadrilla Test',
    especialidad: 'ELECTRICIDAD',
    numeroIntegrantes: 4,
    corredorVial: 'Corredor Norte',
    estado: 'DISPONIBLE',
    ...overrides,
  };
}

describe('serviceCuadrilla', () => {
  describe('crear', () => {
    test('crea una cuadrilla con datos válidos', async () => {
      const cuadrilla = await serviceCuadrilla.crear(datosValidos());
      expect(cuadrilla.id).toBeDefined();
      expect(cuadrilla.codigo).toBe('CUA-TEST');
      expect(cuadrilla.estado).toBe('DISPONIBLE');
    });

    test('rechaza especialidad inválida', async () => {
      await expect(
        serviceCuadrilla.crear(datosValidos({ especialidad: 'INVALIDO' }))
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    });

    test('rechaza número de integrantes menor a 2', async () => {
      await expect(
        serviceCuadrilla.crear(datosValidos({ numeroIntegrantes: 1 }))
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    });

    test('rechaza número de integrantes mayor a 10', async () => {
      await expect(
        serviceCuadrilla.crear(datosValidos({ numeroIntegrantes: 15 }))
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    });

    test('rechaza código duplicado', async () => {
      await serviceCuadrilla.crear(datosValidos());
      await expect(
        serviceCuadrilla.crear(datosValidos({ nombre: 'Otra' }))
      ).rejects.toMatchObject({ code: 'DUPLICATE_CODE', status: 409 });
    });
  });

  describe('obtenerPorId', () => {
    test('devuelve una cuadrilla existente', async () => {
      const creada = await serviceCuadrilla.crear(datosValidos());
      const cuadrilla = await serviceCuadrilla.obtenerPorId(creada.id);
      expect(cuadrilla.codigo).toBe('CUA-TEST');
    });

    test('lanza 404 si no existe', async () => {
      await expect(serviceCuadrilla.obtenerPorId(99999)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        status: 404,
      });
    });
  });

  describe('actualizar', () => {
    test('actualiza una cuadrilla DISPONIBLE', async () => {
      const creada = await serviceCuadrilla.crear(datosValidos());
      const actualizada = await serviceCuadrilla.actualizar(creada.id, {
        nombre: 'Nombre Modificado',
        numeroIntegrantes: 6,
      });
      expect(actualizada.nombre).toBe('Nombre Modificado');
      expect(actualizada.numeroIntegrantes).toBe(6);
    });

    test('rechaza actualizar una cuadrilla ASIGNADA', async () => {
      const creada = await serviceCuadrilla.crear(datosValidos({ estado: 'ASIGNADA' }));
      await expect(
        serviceCuadrilla.actualizar(creada.id, { nombre: 'X' })
      ).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
    });

    test('rechaza cambiar a especialidad inválida', async () => {
      const creada = await serviceCuadrilla.crear(datosValidos());
      await expect(
        serviceCuadrilla.actualizar(creada.id, { especialidad: 'INVALIDO' })
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    });

    test('rechaza actualizar con código duplicado', async () => {
      await serviceCuadrilla.crear(datosValidos({ codigo: 'CUA-001' }));
      const cuadrilla2 = await serviceCuadrilla.crear(datosValidos({ codigo: 'CUA-002' }));
      await expect(
        serviceCuadrilla.actualizar(cuadrilla2.id, { codigo: 'CUA-001' })
      ).rejects.toMatchObject({ code: 'DUPLICATE_CODE', status: 409 });
    });
  });

  describe('cambiarEstado', () => {
    test('cambia estado a INACTIVA', async () => {
      const creada = await serviceCuadrilla.crear(datosValidos());
      const actualizada = await serviceCuadrilla.cambiarEstado(creada.id, 'INACTIVA');
      expect(actualizada.estado).toBe('INACTIVA');
    });

    test('reactiva una cuadrilla INACTIVA', async () => {
      const creada = await serviceCuadrilla.crear(datosValidos({ estado: 'INACTIVA' }));
      const actualizada = await serviceCuadrilla.cambiarEstado(creada.id, 'DISPONIBLE');
      expect(actualizada.estado).toBe('DISPONIBLE');
    });

    test('rechaza estado inválido', async () => {
      const creada = await serviceCuadrilla.crear(datosValidos());
      await expect(
        serviceCuadrilla.cambiarEstado(creada.id, 'INVALIDO')
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    });

    test('rechaza desactivar una cuadrilla ASIGNADA', async () => {
      const creada = await serviceCuadrilla.crear(datosValidos({ estado: 'ASIGNADA' }));
      await expect(
        serviceCuadrilla.cambiarEstado(creada.id, 'INACTIVA')
      ).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
    });
  });

  describe('listar', () => {
    test('devuelve paginación con metadatos', async () => {
      await serviceCuadrilla.crear(datosValidos({ codigo: 'CUA-A', nombre: 'AAA' }));
      await serviceCuadrilla.crear(datosValidos({ codigo: 'CUA-B', nombre: 'BBB' }));

      const resultado = await serviceCuadrilla.listar({ page: 1, size: 10 });
      expect(resultado.data.length).toBe(2);
      expect(resultado.total).toBe(2);
      expect(resultado.page).toBe(1);
      expect(resultado.totalPages).toBe(1);
    });

    test('filtra por especialidad', async () => {
      await serviceCuadrilla.crear(datosValidos({ codigo: 'CUA-A', especialidad: 'ELECTRICIDAD' }));
      await serviceCuadrilla.crear(datosValidos({ codigo: 'CUA-B', especialidad: 'COMUNICACIONES' }));

      const resultado = await serviceCuadrilla.listar({ especialidad: 'ELECTRICIDAD' });
      expect(resultado.data.length).toBe(1);
      expect(resultado.data[0].especialidad).toBe('ELECTRICIDAD');
    });

    test('filtra por estado', async () => {
      await serviceCuadrilla.crear(datosValidos({ codigo: 'CUA-A', estado: 'DISPONIBLE' }));
      await serviceCuadrilla.crear(datosValidos({ codigo: 'CUA-B', estado: 'INACTIVA' }));

      const resultado = await serviceCuadrilla.listar({ estado: 'INACTIVA' });
      expect(resultado.data.length).toBe(1);
    });
  });
});