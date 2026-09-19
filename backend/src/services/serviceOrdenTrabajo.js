const OrdenTrabajo = require('../models/modelOrdenTrabajo');
const Activo = require('../models/modelActivo');
const Cuadrilla = require('../models/modelCuadrilla');
const OrdenCuadrilla = require('../models/modelOrdenCuadrilla');
const { DomainError } = require('./serviceActivo');

const TIPOS = ['PREVENTIVO', 'CORRECTIVO'];
const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA'];

const TRANSICIONES = {
  ABIERTA: ['ASIGNADA', 'CANCELADA'],
  ASIGNADA: ['EN_EJECUCION', 'CANCELADA'],
  EN_EJECUCION: ['CERRADA'],
  CERRADA: ['ABIERTA'],
  CANCELADA: [],
};

async function generarCodigo() {
  const total = await OrdenTrabajo.count();
  return `OT-${String(total + 1).padStart(3, '0')}`;
}

async function listar(filtros) {
  const where = {};
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.prioridad) where.prioridad = filtros.prioridad;
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.activoId) where.activoId = filtros.activoId;

  const page = Math.max(1, parseInt(filtros.page) || 1);
  const size = Math.min(100, Math.max(1, parseInt(filtros.size) || 10));
  const offset = (page - 1) * size;

  const ordenamientosValidos = ['codigo', 'tipo', 'prioridad', 'estado', 'fechaProgramada', 'createdAt'];
  const sort = ordenamientosValidos.includes(filtros.sort) ? filtros.sort : 'createdAt';
  const order = filtros.order === 'asc' ? 'ASC' : 'DESC';

  const { count, rows } = await OrdenTrabajo.findAndCountAll({
    where,
    include: [{ model: Activo, as: 'activo' }],
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
  const orden = await OrdenTrabajo.findByPk(id, {
    include: [{ model: Activo, as: 'activo' }],
  });
  if (!orden) {
    throw new DomainError('NOT_FOUND', 'Orden no encontrada', null, 404);
  }
  return orden;
}

async function crear(datos) {
  datos.codigo = await generarCodigo();

  if (!TIPOS.includes(datos.tipo)) {
    throw new DomainError('VALIDATION_ERROR', 'Tipo inválido', `Debe ser: ${TIPOS.join(', ')}`, 400);
  }
  if (!PRIORIDADES.includes(datos.prioridad)) {
    throw new DomainError('VALIDATION_ERROR', 'Prioridad inválida', `Debe ser: ${PRIORIDADES.join(', ')}`, 400);
  }

  const activo = await Activo.findByPk(datos.activoId);
  if (!activo) {
    throw new DomainError('INVALID_ACTIVO', 'El activo no existe', null, 400);
  }
  if (activo.estado === 'FUERA_DE_SERVICIO') {
    throw new DomainError(
      'CONFLICT',
      'No se puede crear una orden sobre un activo fuera de servicio',
      null,
      409
    );
  }

  const hoy = new Date().toISOString().split('T')[0];
  if (datos.fechaProgramada < hoy) {
    throw new DomainError(
      'VALIDATION_ERROR',
      'Fecha programada inválida',
      'No puede ser anterior a hoy',
      400
    );
  }

  try {
    const orden = await OrdenTrabajo.create(datos);

    if (activo.estado === 'OPERATIVO') {
      await activo.update({ estado: 'EN_MANTENIMIENTO' });
    }

    return orden;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new DomainError('DUPLICATE_CODE', 'Ya existe una orden con ese código', error.message, 409);
    }
    throw error;
  }
}

async function actualizar(id, datos) {
  const orden = await obtenerPorId(id);

  if (orden.estado !== 'ABIERTA') {
    throw new DomainError(
      'CONFLICT',
      'Solo se puede actualizar una orden en estado ABIERTA',
      `Estado actual: ${orden.estado}`,
      409
    );
  }

  if (datos.tipo && !TIPOS.includes(datos.tipo)) {
    throw new DomainError('VALIDATION_ERROR', 'Tipo inválido', `Debe ser: ${TIPOS.join(', ')}`, 400);
  }
  if (datos.prioridad && !PRIORIDADES.includes(datos.prioridad)) {
    throw new DomainError('VALIDATION_ERROR', 'Prioridad inválida', `Debe ser: ${PRIORIDADES.join(', ')}`, 400);
  }

  try {
    await orden.update(datos);
    return orden;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new DomainError('DUPLICATE_CODE', 'Ya existe una orden con ese código', error.message, 409);
    }
    throw error;
  }
}

async function cambiarEstado(id, nuevoEstado, rolUsuario, datos = {}) {
  const orden = await OrdenTrabajo.findByPk(id);
  if (!orden) {
    throw new DomainError('NOT_FOUND', 'Orden no encontrada', null, 404);
  }

  const activo = await Activo.findByPk(orden.activoId);

  const permitidas = TRANSICIONES[orden.estado] || [];
  if (!permitidas.includes(nuevoEstado)) {
    throw new DomainError(
      'INVALID_TRANSITION',
      'Transición de estado no permitida',
      `Desde ${orden.estado} solo se permite: ${permitidas.join(', ')}`,
      409
    );
  }

  if (orden.estado === 'CERRADA' && nuevoEstado === 'ABIERTA' && rolUsuario !== 'COORDINADOR') {
    throw new DomainError(
      'FORBIDDEN',
      'Solo un COORDINADOR puede reabrir una orden cerrada',
      null,
      403
    );
  }

  if (nuevoEstado === 'EN_EJECUCION') {
    const asignaciones = await OrdenCuadrilla.count({ where: { ordenId: id } });
    if (asignaciones === 0) {
      throw new DomainError(
        'CONFLICT',
        'No hay cuadrilla asignada',
        'Asigne una cuadrilla antes de iniciar la orden',
        409
      );
    }
  }

  if (nuevoEstado === 'CERRADA' && !datos.observacionCierre) {
    throw new DomainError(
      'VALIDATION_ERROR',
      'Observación de cierre obligatoria',
      null,
      400
    );
  }

  if (nuevoEstado === 'CANCELADA' && !datos.motivoCancelacion) {
    throw new DomainError(
      'VALIDATION_ERROR',
      'Motivo de cancelación obligatorio',
      null,
      400
    );
  }

  const cambios = { estado: nuevoEstado };
  if (nuevoEstado === 'EN_EJECUCION') {
    cambios.fechaInicio = new Date().toISOString().split('T')[0];
  }
  if (nuevoEstado === 'CERRADA') {
    cambios.fechaCierre = new Date().toISOString().split('T')[0];
    cambios.observacionCierre = datos.observacionCierre;
  }
  if (nuevoEstado === 'CANCELADA') {
    cambios.motivoCancelacion = datos.motivoCancelacion;
  }

  await orden.update(cambios);

  if (nuevoEstado === 'CERRADA' || nuevoEstado === 'CANCELADA') {
    await sincronizarEstadoActivo(activo);
  }

  if (nuevoEstado === 'ABIERTA' && activo.estado === 'OPERATIVO') {
    await activo.update({ estado: 'EN_MANTENIMIENTO' });
  }

  return orden;
}

async function sincronizarEstadoActivo(activo) {
  const ordenesActivas = await OrdenTrabajo.count({
    where: {
      activoId: activo.id,
      estado: ['ABIERTA', 'ASIGNADA', 'EN_EJECUCION'],
    },
  });

  if (ordenesActivas === 0 && activo.estado === 'EN_MANTENIMIENTO') {
    await activo.update({ estado: 'OPERATIVO' });
  }
}

async function asignarCuadrilla(ordenId, cuadrillaId, fechaInicio, fechaFin) {
  const orden = await OrdenTrabajo.findByPk(ordenId);
  if (!orden) {
    throw new DomainError('NOT_FOUND', 'Orden no encontrada', null, 404);
  }

  if (orden.estado !== 'ABIERTA') {
    throw new DomainError(
      'CONFLICT',
      'Solo se puede asignar cuadrilla a una orden ABIERTA',
      `Estado actual: ${orden.estado}`,
      409
    );
  }

  const cuadrilla = await Cuadrilla.findByPk(cuadrillaId);
  if (!cuadrilla) {
    throw new DomainError('INVALID_CUADRILLA', 'La cuadrilla no existe', null, 400);
  }

  if (cuadrilla.estado === 'INACTIVA') {
    throw new DomainError('CONFLICT', 'No se puede asignar una cuadrilla inactiva', null, 409);
  }

  if (!fechaInicio || !fechaFin) {
    throw new DomainError('VALIDATION_ERROR', 'Fecha de inicio y fin son obligatorias', null, 400);
  }

  if (fechaInicio > fechaFin) {
    throw new DomainError('VALIDATION_ERROR', 'Fecha de inicio no puede ser posterior a fecha fin', null, 400);
  }

  const asignaciones = await OrdenCuadrilla.findAll({ where: { cuadrillaId } });

  const haySolapamiento = asignaciones.some(
    (a) => fechaInicio <= a.fechaFin && fechaFin >= a.fechaInicio
  );

  if (haySolapamiento) {
    throw new DomainError(
      'CONFLICT',
      'La cuadrilla ya está asignada a otra orden en ese rango de fechas',
      null,
      409
    );
  }

  const asignacion = await OrdenCuadrilla.create({
    ordenId,
    cuadrillaId,
    fechaAsignacion: new Date().toISOString().split('T')[0],
    fechaInicio,
    fechaFin,
  });

  await orden.update({ estado: 'ASIGNADA' });
  await cuadrilla.update({ estado: 'ASIGNADA' });

  return asignacion;
}

async function desasignarCuadrilla(ordenId, cuadrillaId) {
  const orden = await OrdenTrabajo.findByPk(ordenId);
  if (!orden) {
    throw new DomainError('NOT_FOUND', 'Orden no encontrada', null, 404);
  }

  if (orden.estado !== 'ASIGNADA') {
    throw new DomainError(
      'CONFLICT',
      'Solo se puede desasignar de una orden en estado ASIGNADA',
      `Estado actual: ${orden.estado}`,
      409
    );
  }

  const asignacion = await OrdenCuadrilla.findOne({
    where: { ordenId, cuadrillaId },
  });

  if (!asignacion) {
    throw new DomainError('NOT_FOUND', 'Asignación no encontrada', null, 404);
  }

  await asignacion.destroy();

  const restantes = await OrdenCuadrilla.count({ where: { ordenId } });
  if (restantes === 0) {
    await orden.update({ estado: 'ABIERTA' });
  }

  const cuadrilla = await Cuadrilla.findByPk(cuadrillaId);
  if (cuadrilla) {
    const asignacionesActivas = await OrdenCuadrilla.count({ where: { cuadrillaId } });
    if (asignacionesActivas === 0) {
      await cuadrilla.update({ estado: 'DISPONIBLE' });
    }
  }

  return { mensaje: 'Cuadrilla desasignada' };
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  cambiarEstado,
  asignarCuadrilla,
  desasignarCuadrilla,
};