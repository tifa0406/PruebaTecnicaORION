const bcrypt = require('bcryptjs');
const sequelize = require('../src/config/database');
const Usuario = require('../src/models/modelUsuario');
const serviceAuth = require('../src/services/serviceAuth');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await Usuario.destroy({ where: {}, truncate: true });
  const hash = await bcrypt.hash('123456', 10);
  await Usuario.create({
    email: 'test@orion.com',
    password: hash,
    nombre: 'Test User',
    rol: 'SUPERVISOR',
  });
});

describe('serviceAuth', () => {
  describe('login', () => {
    test('devuelve token con credenciales válidas', async () => {
      const resultado = await serviceAuth.login('test@orion.com', '123456');
      expect(resultado.token).toBeDefined();
      expect(resultado.usuario.email).toBe('test@orion.com');
      expect(resultado.usuario.rol).toBe('SUPERVISOR');
    });

    test('rechaza credenciales inválidas', async () => {
      await expect(
        serviceAuth.login('test@orion.com', 'wrong')
      ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 });
    });

    test('rechaza si faltan campos', async () => {
      await expect(serviceAuth.login('', '')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    });
  });
});