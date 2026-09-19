const TIPOS_VALIDOS = [
  'PMV',
  'CCTV',
  'ESTACION_METEOROLOGICA',
  'SENSOR_TRAFICO',
  'AFORADOR',
];

const ESTADOS_VALIDOS = [
  'OPERATIVO',
  'EN_MANTENIMIENTO',
  'FUERA_DE_SERVICIO',
];

function validarCreacion(req, res, next) {
  const { nombre, tipo, ubicacion, corredorVial, fechaInstalacion } = req.body;

  if (!nombre || !tipo || !ubicacion || !corredorVial || !fechaInstalacion) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Faltan campos obligatorios',
      details: 'nombre, tipo, ubicacion, corredorVial y fechaInstalacion son obligatorios',
    });
  }

  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Tipo de activo no permitido',
      details: `Tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}`,
    });
  }

  if (nombre.length > 120) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Nombre demasiado largo',
      details: 'El nombre tiene máximo 120 caracteres',
    });
  }

  if (ubicacion.length > 255) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Ubicación demasiado larga',
      details: 'La ubicación tiene máximo 255 caracteres',
    });
  }

  if (new Date(fechaInstalacion) > new Date()) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Fecha de instalación inválida',
      details: 'La fecha de instalación no puede ser futura',
    });
  }

  next();
}

function validarActualizacion(req, res, next) {
  const { tipo, nombre, ubicacion, fechaInstalacion } = req.body;

  if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Tipo de activo no permitido',
      details: `Tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}`,
    });
  }

  if (nombre && nombre.length > 120) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Nombre demasiado largo',
      details: 'El nombre tiene máximo 120 caracteres',
    });
  }

  if (ubicacion && ubicacion.length > 255) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Ubicación demasiado larga',
      details: 'La ubicación tiene máximo 255 caracteres',
    });
  }

  if (fechaInstalacion && new Date(fechaInstalacion) > new Date()) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Fecha de instalación inválida',
      details: 'La fecha de instalación no puede ser futura',
    });
  }

  next();
}

function validarCambioEstado(req, res, next) {
  const { estado } = req.body;

  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Estado inválido',
      details: `Estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`,
    });
  }

  next();
}

module.exports = {
  validarCreacion,
  validarActualizacion,
  validarCambioEstado,
};