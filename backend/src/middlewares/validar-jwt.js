const jwt = require("jsonwebtoken");
const { pool } = require("../config/db.config");
const { StatusCodes } = require("http-status-codes");

const validarJWT = async (req, res, next) => {
  // Leer el token del header x-token o Authorization
  let token = req.header("x-token");

  // Si no está en x-token, buscar en Authorization Bearer
  if (!token) {
    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Remover "Bearer " del inicio
    }
  }

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "No hay token en la petición",
    });
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "tu_secreto_super_seguro",
    );

    if (!decoded.id) {
      throw new Error("Token inválido: falta el ID de usuario");
    }

    // Buscar el usuario en la base de datos
    const [usuarios] = await pool.query(
      `SELECT 
        idUsuario, 
        nombre, 
        apellidoPaterno, 
        apellidoMaterno, 
        email, 
        tipoUsuario,
        activo
      FROM usuarios 
      WHERE idUsuario = ?`,
      [decoded.id],
    );

    if (usuarios.length === 0) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "El usuario no existe en la base de datos",
      });
    }

    const usuario = usuarios[0];

    // Verificar si el usuario está activo
    if (usuario.activo !== 1) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "El usuario está inactivo",
      });
    }

    // Agregar el usuario al request para usarlo en los controladores
    req.user = {
      id: usuario.idUsuario,
      nombre: usuario.nombre,
      apellidoPaterno: usuario.apellidoPaterno,
      apellidoMaterno: usuario.apellidoMaterno,
      email: usuario.email,
      tipoUsuario: usuario.tipoUsuario,
    };

    next();
  } catch (error) {
    console.error("Error al validar token:", error);

    let message = "Token no válido";

    if (error.name === "TokenExpiredError") {
      message = "La sesión ha expirado. Por favor, inicia sesión nuevamente.";
    } else if (error.name === "JsonWebTokenError") {
      message = "Token inválido o mal formado";
    }

    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Middleware para verificar si el usuario es un guardia o admin
const esGuardia = (req, res, next) => {
  if (
    req.user &&
    (req.user.tipoUsuario === "guardia" || req.user.tipoUsuario === "admin")
  ) {
    return next();
  }

  return res.status(StatusCodes.FORBIDDEN).json({
    success: false,
    message:
      "No tiene permiso para realizar esta acción. Se requiere rol de guardia o administrador.",
  });
};

module.exports = {
  validarJWT,
  esGuardia,
};
