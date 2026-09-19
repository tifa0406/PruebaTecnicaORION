const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/modelUsuario');
const { DomainError } = require('./serviceActivo');

const JWT_SECRET = process.env.JWT_SECRET || 'orion_secret_key';
const JWT_EXPIRES_IN = '8h';

async function login(email, password) {
  if (!email || !password) {
    throw new DomainError('VALIDATION_ERROR', 'Email y contraseña son obligatorios', null, 400);
  }

  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) {
    throw new DomainError('INVALID_CREDENTIALS', 'Credenciales inválidas', null, 401);
  }

  const passwordValida = await bcrypt.compare(password, usuario.password);
  if (!passwordValida) {
    throw new DomainError('INVALID_CREDENTIALS', 'Credenciales inválidas', null, 401);
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    },
  };
}

function verificarToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new DomainError('INVALID_TOKEN', 'Token inválido o expirado', null, 401);
  }
}

module.exports = { login, verificarToken };