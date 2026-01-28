const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const { pool } = require('../config/db.config');
const logger = require('../utils/logger');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    logger.error('No se encontró token en la petición');
    logger.error('Headers:', req.headers.authorization);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'No estás autorizado para acceder a esta ruta',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu_secreto_super_seguro'
    );

    const [user] = await pool.query(
      'SELECT idUsuario, nombre, apellidoPaterno, apellidoMaterno, email, tipoUsuario FROM usuarios WHERE idUsuario = ?',
      [decoded.id]
    );

    if (user.length === 0) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Usuario no encontrado con este token',
      });
    }

    req.user = user[0];
    next();
  } catch (error) {
    logger.error(`Error en autenticación: ${error.message}`);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'No estás autorizado para acceder a esta ruta',
    });
  }
};


// Middleware para autorizar por roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.tipoUsuario)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Usuario con rol ${req.user.tipoUsuario} no está autorizado para acceder a esta ruta`,
      });
    }
    next();
  };
};
