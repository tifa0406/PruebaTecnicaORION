const Cuadrilla = require('../models/modelCuadrilla');
const { DomainError } = require('./serviceActivo');

const ESPECIALIDADES = ['ELECTRICIDAD', 'COMUNICACIONES', 'OBRA_CIVIL', 'MULTIDISCIPLINARIA'];
const ESTADOS = ['DISPONIBLE', 'ASIGNADA', 'INACTIVA'];

async function generarCodigo() {
  const total = await Cuadrilla.count();
  return `CUA-${String(total + 1).padStart(3, '0')}`;
}

async function listar(filtros) {
  const where = {};
  if (filtros.especialidad) where.especialidad = filtros.especialidad;
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.corredorVial) where.corredorVial = filtros.corredorVial;

  const page = Math.max(1, parseInt(filtros.page) || 1);
  const size = Math.min(100, Math.max(1, parseInt(filtros.size) || 10));
  const offset = (page - 1) * size;

  const ordenamientosValidos = ['codigo', 'nombre', 'especialidad', 'estado'];
  const sort = ordenamientosValidos.includes(filtros.sort) ? filtros.sort : 'nombre';
  const order = filtros.order === 'desc' ? 'DESC' : 'ASC';

  const { count, rows } = await Cuadrilla.findAndCountAll({
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
  const cuadrilla = await Cuadrilla.findByPk(id);
  if (!cuadrilla) {
    throw new DomainError('NOT_FOUND', 'Cuadrilla no encontrada', null, 404);
  }
  return cuadrilla;
}

async function crear(datos) {
  datos.codigo = await generarCodigo();

  if (!ESPECIALIDADES.includes(datos.especialidad)) {
    throw new DomainError('VALIDATION_ERROR', 'Especialidad inválida', `Debe ser: ${ESPECIALIDADES.join(', ')}`, 400);
  }
  if (datos.numeroIntegrantes < 2 || datos.numeroIntegrantes > 10) {
    throw new DomainError('VALIDATION_ERROR', 'Número de integrantes inválido', 'Debe estar entre 2 y 10', 400);
  }

  try {
    return await Cuadrilla.create(datos);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new DomainError('DUPLICATE_CODE', 'Ya existe una cuadrilla con ese código', error.message, 409);
    }
    throw error;
  }
}

async function actualizar(id, datos) {
  const cuadrilla = await obtenerPorId(id);

  if (cuadrilla.estado === 'ASIGNADA') {
    throw new DomainError('CONFLICT', 'No se puede editar una cuadrilla asignada', null, 409);
  }

  if (datos.especialidad && !ESPECIALIDADES.includes(datos.especialidad)) {
    throw new DomainError('VALIDATION_ERROR', 'Especialidad inválida', null, 400);
  }

  try {
    await cuadrilla.update(datos);
    return cuadrilla;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new DomainError('DUPLICATE_CODE', 'Ya existe una cuadrilla con ese código', error.message, 409);
    }
    throw error;
  }
}

async function cambiarEstado(id, nuevoEstado) {
  const cuadrilla = await obtenerPorId(id);

  if (!ESTADOS.includes(nuevoEstado)) {
    throw new DomainError('VALIDATION_ERROR', 'Estado inválido', null, 400);
  }

  if (cuadrilla.estado === 'ASIGNADA' && nuevoEstado === 'INACTIVA') {
    throw new DomainError('CONFLICT', 'No se puede desactivar una cuadrilla asignada', null, 409);
  }

  await cuadrilla.update({ estado: nuevoEstado });
  return cuadrilla;
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  cambiarEstado,
};