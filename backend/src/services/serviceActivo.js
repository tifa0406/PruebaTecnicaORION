const Activo = require('../models/modelActivo');
const Corredor = require('../models/modelCorredor');

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

async function validarCorredor(corredorVial) {
  const corredor = await Corredor.findOne({ where: { nombre: corredorVial } });
  if (!corredor) {
    throw new DomainError(
      'INVALID_CORREDOR',
      'El corredor vial no existe',
      `Corredor "${corredorVial}" no está en el catálogo`,
      400
    );
  }
}

async function listar(filtros) {
  const where = {};
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.corredorVial) where.corredorVial = filtros.corredorVial;

  // Paginación con valores por defecto
  const page = Math.max(1, parseInt(filtros.page) || 1);
  const size = Math.min(100, Math.max(1, parseInt(filtros.size) || 10));
  const offset = (page - 1) * size;

  // Ordenamiento configurable
  const ordenamientosValidos = ['codigo', 'nombre', 'tipo', 'estado', 'fechaInstalacion'];
  const sort = ordenamientosValidos.includes(filtros.sort) ? filtros.sort : 'codigo';
  const order = filtros.order === 'desc' ? 'DESC' : 'ASC';

  const { count, rows } = await Activo.findAndCountAll({
    where,
    order: [[sort, order]],
    limit: size,
    offset,
  });

  return {
    data: rows,
    total: count,
    page,
    size,
    totalPages: Math.ceil(count / size),
  };
}

async function obtenerPorId(id) {
  const activo = await Activo.findByPk(id);
  if (!activo) {
    throw new DomainError('NOT_FOUND', 'Activo no encontrado', null, 404);
  }
  return activo;
}

async function crear(datos) {
  await validarCorredor(datos.corredorVial);
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

  // RN-10: validar corredor si se cambia
  if (datos.corredorVial && datos.corredorVial !== activo.corredorVial) {
    await validarCorredor(datos.corredorVial);
  }

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