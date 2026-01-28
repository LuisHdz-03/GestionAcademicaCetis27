const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log para desarrollo
  logger.error(`Error: ${err.message}`);
  logger.error(err.stack);

  // Manejo de errores de validación
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new Error(message);
    error.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Manejo de errores de duplicados (código 11000 de MongoDB)
  if (err.code === 'ER_DUP_ENTRY') {
    const message = 'El valor ingresado ya existe';
    error = new Error(message);
    error.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Manejo de errores de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token de autenticación inválido';
    error = new Error(message);
    error.statusCode = StatusCodes.UNAUTHORIZED;
  }

  // Manejo de errores de expiración de JWT
  if (err.name === 'TokenExpiredError') {
    const message = 'La sesión ha expirado, por favor inicie sesión nuevamente';
    error = new Error(message);
    error.statusCode = StatusCodes.UNAUTHORIZED;
  }

  // Manejo de errores de MySQL
  if (err.code && err.code.startsWith('ER_')) {
    let message = `Error de base de datos: ${err.message}`;
    
    // Mensajes más específicos para errores comunes
    if (err.code === 'ER_NO_SUCH_TABLE') {
      message = `La tabla no existe: ${err.message}`;
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      message = `Error de referencia: ${err.message}`;
    }
    
    error = new Error(message);
    error.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }

  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const errorMessage = error.message || err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
  });
};

module.exports = { errorHandler };
