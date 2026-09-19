const OrdenTrabajo = require('../models/modelOrdenTrabajo');
const Activo = require('../models/modelActivo');
const { DomainError } = require('./serviceActivo');

const TIPOS = ['PREVENTIVO', 'CORRECTIVO'];
const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA'];

const TRANSICIONES = {
  ABIERTA: ['ASIGNADA', 'CANCELADA'],
  ASIGNADA: ['EN_EJECUCION', 'CANCELADA'],
  EN_EJECUCION: ['CERRADA'],
  CERRADA: ['ABIERTA'], // solo COORDINADOR
  CANCELADA: [],
};

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

    // RN-07: activo pasa a EN_MANTENIMIENTO si estaba OPERATIVO
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
  const orden = await obtenerIdConActivo(id);
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

  // Reapertura (CERRADA → ABIERTA) solo COORDINADOR
  if (orden.estado === 'CERRADA' && nuevoEstado === 'ABIERTA' && rolUsuario !== 'COORDINADOR') {
    throw new DomainError(
      'FORBIDDEN',
      'Solo un COORDINADOR puede reabrir una orden cerrada',
      null,
      403
    );
  }

  // Cierre (EN_EJECUCION → CERRADA) requiere observación
  if (nuevoEstado === 'CERRADA' && !datos.observacionCierre) {
    throw new DomainError(
      'VALIDATION_ERROR',
      'Observación de cierre obligatoria',
      null,
      400
    );
  }

  // Cancelación requiere motivo
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

  // RN-08: si se cierra o cancela la última orden activa, el activo vuelve a OPERATIVO
  if (nuevoEstado === 'CERRADA' || nuevoEstado === 'CANCELADA') {
    await sincronizarEstadoActivo(activo);
  }

  // Si se reabre una orden CERRADA, el activo vuelve a EN_MANTENIMIENTO si estaba OPERATIVO
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

async function obtenerIdConActivo(id) {
  const orden = await OrdenTrabajo.findByPk(id);
  if (!orden) {
    throw new DomainError('NOT_FOUND', 'Orden no encontrada', null, 404);
  }
  return orden;
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  cambiarEstado,
};