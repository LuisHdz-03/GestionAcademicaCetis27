const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const { pool } = require('../config/db.config');
const logger = require('../utils/logger');

// Generar JWT
const generateToken = (id, tipoUsuario) => {
  return jwt.sign(
    { 
      id,
      tipoUsuario // Incluir el tipo de usuario en el token
    },
    process.env.JWT_SECRET || 'tu_secreto_super_seguro',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @desc    Autenticar usuario
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Por favor ingrese email y contraseña',
      });
    }

    // Buscar usuario
    const [user] = await pool.query(
      'SELECT idUsuario, nombre, apellidoPaterno, apellidoMaterno, email, password, tipoUsuario FROM usuarios WHERE email = ? AND activo = true',
      [email]
    );

    if (user.length === 0) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    const usuario = user[0];

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Crear token con el tipo de usuario
    const token = generateToken(usuario.idUsuario, usuario.tipoUsuario);

    // Eliminar contraseña del objeto de respuesta
    delete usuario.password;

    // Normalizar el objeto usuario para que tenga 'id' además de 'idUsuario'
    const usuarioResponse = {
      id: usuario.idUsuario,
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      apellidoPaterno: usuario.apellidoPaterno,
      apellidoMaterno: usuario.apellidoMaterno,
      email: usuario.email,
      tipoUsuario: usuario.tipoUsuario,
    };

    res.status(StatusCodes.OK).json({
      success: true,
      token,
      usuario: usuarioResponse,
    });
  } catch (error) {
    logger.error(`Error en login: ${error.message}`);
    next(error);
  }
};

// @desc    Obtener usuario autenticado
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const [user] = await pool.query(
      'SELECT idUsuario, nombre, apellidoPaterno, apellidoMaterno, email, tipoUsuario FROM usuarios WHERE idUsuario = ?',
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: user[0],
    });
  } catch (error) {
    logger.error(`Error al obtener perfil de usuario: ${error.message}`);
    next(error);
  }
};
