function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Error interno del servidor';
  const details = err.details || null;

  res.status(status).json({ code, message, details });
}

module.exports = errorHandler;