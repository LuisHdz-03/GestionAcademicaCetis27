require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { errorHandler } = require("./middlewares/error.middleware");
const logger = require("./utils/logger");

// Importar rutas
const authRoutes = require("./routes/auth.routes");
const periodoRoutes = require("./routes/periodo.routes");
const communityRoutes = require("./routes/community.routes");
const academicoRoutes = require("./routes/academico.routes");
const estudianteRoutes = require("./routes/estudiante.routes");
const reporteRoutes = require("./routes/reporte.routes");

const app = express();

// Configuración básica de seguridad
app.use(helmet());

// Configuración de CORS
const corsOptions = {
  origin: "http://localhost:3000", // Especifica el origen permitido
  credentials: true, // Habilita el envío de credenciales
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-token"],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Limitar peticiones
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de peticiones por ventana
  message: "Demasiadas peticiones desde esta IP, por favor intente más tarde.",
});
app.use(limiter);

// Rutas
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/periodos", periodoRoutes);
app.use("/api/v1/community", communityRoutes);
app.use("/api/v1/academico", academicoRoutes);
app.use("/api/v1/estudiantes", estudianteRoutes);
app.use("/api/v1/reportes", reporteRoutes);

// Rutas de usuario sin autenticación (para compatibilidad con el frontend)
app.get("/api/v1/usuario/me", (req, res) => {
  const idUsuario = req.query.idUsuario;

  if (!idUsuario) {
    return res.status(400).json({ error: "Se requiere idUsuario" });
  }

  const { pool } = require("./config/db.config");

  const query = `
    SELECT nombre, apellidoPaterno, apellidoMaterno, tipoUsuario
    FROM usuarios
    WHERE idUsuario = ? AND activo = true
  `;

  pool.query(query, [idUsuario], (err, results) => {
    if (err) {
      console.error("Error al obtener usuario:", err);
      return res.status(500).json({ error: "Error al obtener usuario" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = results[0];
    res.json({
      nombreCompleto: `${usuario.nombre} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno || ""}`,
      tipoUsuario: usuario.tipoUsuario,
    });
  });
});

app.get("/api/v1/usuario/sidebar", (req, res) => {
  const idUsuario = req.query.idUsuario;

  if (!idUsuario) {
    return res.status(400).json({ error: "Se requiere idUsuario" });
  }

  const { pool } = require("./config/db.config");

  const query = `
    SELECT nombre, apellidoPaterno, email
    FROM usuarios
    WHERE idUsuario = ? AND activo = true
  `;

  pool.query(query, [idUsuario], (err, results) => {
    if (err) {
      console.error("Error al obtener usuario para sidebar:", err);
      return res.status(500).json({ error: "Error al obtener usuario" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = results[0];
    res.json(usuario);
  });
});

// Ruta de prueba
app.get("/api/v1/health", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "API funcionando correctamente" });
});

// Manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    error: {
      statusCode: 404,
      message: "La ruta solicitada no existe.",
    },
  });
});

const PORT = process.env.PORT || 4000;
const server = createServer(app);

// Iniciar servidor
server.listen(PORT, () => {
  logger.info(`Servidor escuchando en el puerto ${PORT}`);
});

// Manejo de errores no capturados
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled Rejection:", error);
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = { app, server };
