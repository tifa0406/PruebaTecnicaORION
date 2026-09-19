const serviceAuth = require('../services/serviceAuth');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Token no proporcionado',
      details: null,
    });
  }

  const token = header.substring(7);
  try {
    const decoded = serviceAuth.verificarToken(token);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(error.status || 401).json({
      code: error.code || 'INVALID_TOKEN',
      message: error.message,
      details: error.details,
    });
  }
}

function roleMiddleware(rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'No tiene permisos para realizar esta operación',
        details: `Roles permitidos: ${rolesPermitidos.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = { authMiddleware, roleMiddleware };