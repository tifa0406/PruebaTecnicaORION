const Activo = require('../models/modelActivo');

const TRANSICIONES = {
  OPERATIVO: ['EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO'],
  EN_MANTENIMIENTO: ['OPERATIVO', 'FUERA_DE_SERVICIO'],
  FUERA_DE_SERVICIO: ['OPERATIVO'],
};

class DomainError extends Error {
  constructor(code, message, details, status) {
    super(message);
    this.code = code;
    this.details = details;
    this.status = status || 400;
  }
}

async function listar(filtros) {
  const where = {};
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.corredorVial) where.corredorVial = filtros.corredorVial;

  return Activo.findAll({ where, order: [['codigo', 'ASC']] });
}

async function obtenerPorId(id) {
  const activo = await Activo.findByPk(id);
  if (!activo) {
    throw new DomainError('NOT_FOUND', 'Activo no encontrado', null, 404);
  }
  return activo;
}

async function crear(datos) {
  try {
    return await Activo.create(datos);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new DomainError(
        'DUPLICATE_CODE',
        'Ya existe un activo con ese código',
        error.message,
        409
      );
    }
    throw error;
  }
}

async function actualizar(id, datos) {
  const activo = await obtenerPorId(id);

  // RN-12: no reasignar corredor si está fuera de servicio
  if (
    activo.estado === 'FUERA_DE_SERVICIO' &&
    datos.corredorVial &&
    datos.corredorVial !== activo.corredorVial
  ) {
    throw new DomainError(
      'CONFLICT',
      'No se puede reasignar un activo fuera de servicio',
      'Primero debe reactivarse el activo',
      409
    );
  }

  try {
    await activo.update(datos);
    return activo;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new DomainError(
        'DUPLICATE_CODE',
        'Ya existe un activo con ese código',
        error.message,
        409
      );
    }
    throw error;
  }
}

async function cambiarEstado(id, nuevoEstado, rolUsuario) {
  const activo = await obtenerPorId(id);

  const permitidas = TRANSICIONES[activo.estado] || [];
  if (!permitidas.includes(nuevoEstado)) {
    throw new DomainError(
      'INVALID_TRANSITION',
      'Transición de estado no permitida',
      `Desde ${activo.estado} solo se permite: ${permitidas.join(', ')}`,
      409
    );
  }

  // RN-08: FUERA_DE_SERVICIO → OPERATIVO solo con COORDINADOR
  if (
    activo.estado === 'FUERA_DE_SERVICIO' &&
    nuevoEstado === 'OPERATIVO' &&
    rolUsuario !== 'COORDINADOR'
  ) {
    throw new DomainError(
      'FORBIDDEN',
      'Solo un COORDINADOR puede reactivar un activo fuera de servicio',
      null,
      403
    );
  }

  await activo.update({ estado: nuevoEstado });
  return activo;
}
module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  cambiarEstado,
  DomainError,
};