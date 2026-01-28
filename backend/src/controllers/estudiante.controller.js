const { pool } = require("../config/db.config");
const logger = require("../utils/logger");
const { StatusCodes } = require("http-status-codes");

/**
 * Busca un estudiante por su número de control
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función de middleware de Express
 */
exports.buscarPorNumeroControl = async (req, res, next) => {
  const { numeroControl } = req.params;

  if (!numeroControl) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "El número de control es requerido",
    });
  }

  try {
    // Buscar el estudiante con información del usuario y especialidad
    const [estudiantes] = await pool.query(
      `
      SELECT 
        e.*, 
        u.nombre, 
        u.apellidoPaterno, 
        u.apellidoMaterno, 
        u.email,
        esp.nombre as nombreEspecialidad
      FROM estudiantes e
      JOIN usuarios u ON e.idUsuario = u.idUsuario
      LEFT JOIN especialidades esp ON e.idEspecialidad = esp.idEspecialidad
      WHERE e.numeroControl = ?
    `,
      [numeroControl],
    );

    if (estudiantes.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Estudiante no encontrado",
      });
    }

    const estudiante = estudiantes[0];

    // Formatear la respuesta
    const respuesta = {
      idEstudiante: estudiante.idEstudiante,
      numeroControl: estudiante.numeroControl,
      nombreCompleto:
        `${estudiante.nombre} ${estudiante.apellidoPaterno} ${estudiante.apellidoMaterno || ""}`.trim(),
      nombre: estudiante.nombre,
      apellidoPaterno: estudiante.apellidoPaterno,
      apellidoMaterno: estudiante.apellidoMaterno,
      email: estudiante.email,
      curp: estudiante.curp,
      fechaNacimiento: estudiante.fechaNacimiento,
      direccion: estudiante.direccion,
      telefono: estudiante.telefono,
      semestreActual: estudiante.semestreActual,
      codigoQr: estudiante.codigoQr,
      fechaIngreso: estudiante.fechaIngreso,
      especialidad: {
        idEspecialidad: estudiante.idEspecialidad,
        nombre: estudiante.nombreEspecialidad,
      },
      fotoUrl: estudiante.fotoUrl || "/images/avatar-default.png",
    };

    res.status(StatusCodes.OK).json({
      success: true,
      data: respuesta,
    });
  } catch (error) {
    logger.error(
      `Error al buscar estudiante por número de control: ${error.message}`,
    );
    next(error);
  }
};

/**
 * Registra la asistencia de un estudiante
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función de middleware de Express
 */
exports.registrarAsistencia = async (req, res, next) => {
  const { idEstudiante } = req.params;
  const { idUsuarioRegistro, tipo = "entrada", observaciones = "" } = req.body;

  if (!idEstudiante || !idUsuarioRegistro) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "ID de estudiante y usuario de registro son requeridos",
    });
  }

  try {
    // Verificar si el estudiante existe
    const [estudiantes] = await pool.query(
      "SELECT idEstudiante FROM estudiantes WHERE idEstudiante = ?",
      [idEstudiante],
    );

    if (estudiantes.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Estudiante no encontrado",
      });
    }

    // Verificar si la tabla registros_entrada existe, si no, crearla
    try {
      const [tableCheck] = await pool.query(
        "SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registros_entrada'",
        [process.env.DB_NAME || "control_academico"],
      );

      if (tableCheck[0].count === 0) {
        // Crear la tabla si no existe
        await pool.query(`
          CREATE TABLE registros_entrada (
            idRegistroEntrada INT AUTO_INCREMENT PRIMARY KEY,
            idEstudiante INT NOT NULL,
            idUsuarioRegistro INT NOT NULL,
            tipo ENUM('entrada', 'salida') NOT NULL DEFAULT 'entrada',
            observaciones TEXT,
            fechaHoraRegistro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (idEstudiante) REFERENCES estudiantes(idEstudiante) ON DELETE CASCADE,
            FOREIGN KEY (idUsuarioRegistro) REFERENCES usuarios(idUsuario) ON DELETE CASCADE,
            INDEX idx_idEstudiante (idEstudiante),
            INDEX idx_fechaHoraRegistro (fechaHoraRegistro),
            INDEX idx_tipo (tipo)
          ) ENGINE=InnoDB
        `);
        logger.info("Tabla registros_entrada creada automáticamente");
      }
    } catch (createError) {
      logger.error(`Error al verificar/crear tabla: ${createError.message}`);
      // Continuar, el error se capturará en el siguiente try-catch
    }

    // Registrar el ingreso a la institución (usar registros_entrada en lugar de asistencias)
    // registros_entrada es para entrada/salida física a la preparatoria
    // asistencias (si existe) sería para asistencia a clases
    const [result] = await pool.query(
      `INSERT INTO registros_entrada 
       (idEstudiante, idUsuarioRegistro, tipo, observaciones, fechaHoraRegistro)
       VALUES (?, ?, ?, ?, NOW())`,
      [idEstudiante, idUsuarioRegistro, tipo, observaciones],
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: {
        idRegistroEntrada: result.insertId,
        idEstudiante,
        tipo,
        fechaHoraRegistro: new Date().toISOString(),
        observaciones,
      },
    });
  } catch (error) {
    logger.error(`Error al registrar asistencia: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    logger.error(`Error code: ${error.code}`);

    // Si el error es que la tabla no existe, dar un mensaje más claro
    if (
      error.code === "ER_NO_SUCH_TABLE" ||
      error.message.includes("registros_entrada") ||
      error.message.includes("doesn't exist")
    ) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          "La tabla de registros_entrada no existe. Por favor, ejecute el script setup-registros-entrada-table.js para crearla.",
      });
    }

    // Si hay un error de foreign key, puede ser que falte la tabla estudiantes
    if (
      error.code === "ER_NO_REFERENCED_ROW_2" ||
      error.code === "ER_NO_SUCH_TABLE"
    ) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          "Error en la base de datos. Verifique que las tablas estudiantes y usuarios existan.",
      });
    }

    // Para otros errores de MySQL
    if (error.code && error.code.startsWith("ER_")) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: `Error de base de datos: ${error.message}`,
      });
    }

    // Error genérico
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Error al registrar el ingreso del alumno",
    });
  }
};

/**
 * Carga masiva de estudiantes desde CSV
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función de middleware de Express
 */
exports.cargaMasiva = async (req, res, next) => {
  const { alumnos } = req.body;

  if (!alumnos || !Array.isArray(alumnos) || alumnos.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Se requiere un array de alumnos",
    });
  }

  const connection = await pool.getConnection();
  const resultados = {
    exitosos: [],
    fallidos: [],
    total: alumnos.length,
  };

  try {
    await connection.beginTransaction();

    for (let i = 0; i < alumnos.length; i++) {
      const alumno = alumnos[i];

      try {
        // 1. Buscar idEspecialidad por nombre de carrera
        let idEspecialidad = null;
        if (alumno.carrera) {
          const [especialidades] = await connection.query(
            "SELECT idEspecialidad FROM especialidades WHERE UPPER(nombre) LIKE UPPER(?) OR UPPER(codigo) = UPPER(?)",
            [`%${alumno.carrera}%`, alumno.carrera],
          );

          if (especialidades.length > 0) {
            idEspecialidad = especialidades[0].idEspecialidad;
          } else {
            throw new Error(`Especialidad no encontrada: ${alumno.carrera}`);
          }
        }

        // 2. Verificar si el usuario ya existe (por email o CURP)
        const [usuariosExistentes] = await connection.query(
          "SELECT idUsuario FROM usuarios WHERE email = ? OR curp = ?",
          [alumno.usuario.email, alumno.usuario.curp],
        );

        let idUsuario;
        if (usuariosExistentes.length > 0) {
          // Usuario ya existe, usar ese ID
          idUsuario = usuariosExistentes[0].idUsuario;

          // Actualizar información del usuario
          await connection.query(
            `UPDATE usuarios SET 
              nombre = ?, 
              apellidoPaterno = ?, 
              apellidoMaterno = ?,
              fechaNacimiento = ?,
              matricula = ?,
              fechaActualizacion = NOW()
            WHERE idUsuario = ?`,
            [
              alumno.usuario.nombre,
              alumno.usuario.apellidoPaterno,
              alumno.usuario.apellidoMaterno,
              alumno.usuario.fechaNacimiento,
              alumno.usuario.matricula,
              idUsuario,
            ],
          );
        } else {
          // 4. Insertar en tabla usuarios
          const [resultUsuario] = await connection.query(
            `INSERT INTO usuarios (
              nombre, apellidoPaterno, apellidoMaterno, email, password,
              tipoUsuario, activo, curp, fechaNacimiento, matricula,
              telefono, fechaCreacion, fechaActualizacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              alumno.usuario.nombre,
              alumno.usuario.apellidoPaterno,
              alumno.usuario.apellidoMaterno,
              alumno.usuario.email,
              alumno.usuario.password, // Nota: Deberías hashear esto en producción
              alumno.usuario.tipoUsuario,
              alumno.usuario.activo ? 1 : 0,
              alumno.usuario.curp,
              alumno.usuario.fechaNacimiento,
              alumno.usuario.matricula,
              alumno.usuario.telefono || null,
            ],
          );

          idUsuario = resultUsuario.insertId;
          logger.info(
            `Usuario creado con ID: ${idUsuario} para ${alumno.usuario.email}`,
          );
        }

        // 5. Verificar si el estudiante ya existe (solo por CURP)
        logger.info(
          `Verificando estudiante existente - numeroControl: ${alumno.estudiante.numeroControl}, idUsuario: ${idUsuario}, curp: ${alumno.estudiante.curp}`,
        );

        const [estudiantesExistentes] = await connection.query(
          "SELECT idEstudiante FROM estudiantes WHERE curp = ?",
          [alumno.estudiante.curp],
        );

        logger.info(
          `Estudiantes existentes encontrados: ${estudiantesExistentes.length}`,
        );

        if (estudiantesExistentes.length > 0) {
          // Actualizar estudiante existente
          await connection.query(
            `UPDATE estudiantes SET
              idEspecialidad = ?,
              semestreActual = ?,
              fechaNacimiento = ?,
              telefono = ?,
              fechaEdicion = NOW()
            WHERE idEstudiante = ?`,
            [
              idEspecialidad,
              alumno.estudiante.semestreActual,
              alumno.estudiante.fechaNacimiento,
              alumno.estudiante.telefono || null,
              estudiantesExistentes[0].idEstudiante,
            ],
          );

          resultados.exitosos.push({
            numeroControl: alumno.estudiante.numeroControl,
            nombre: `${alumno.usuario.nombre} ${alumno.usuario.apellidoPaterno}`,
            accion: "actualizado",
          });
        } else {
          // 6. Insertar en tabla estudiantes
          const estudianteData = [
            idUsuario,
            idEspecialidad,
            alumno.estudiante.numeroControl,
            alumno.estudiante.curp,
            alumno.estudiante.fechaNacimiento,
            alumno.estudiante.telefono || null,
            alumno.estudiante.semestreActual,
            alumno.estudiante.direccion || null,
            alumno.estudiante.fechaIngreso || null,
          ];

          logger.info(
            `Insertando estudiante - idUsuario: ${idUsuario}, idEspecialidad: ${idEspecialidad}, numeroControl: ${alumno.estudiante.numeroControl}, curp: ${alumno.estudiante.curp}`,
          );

          const [resultEstudiante] = await connection.query(
            `INSERT INTO estudiantes (
              idUsuario, idEspecialidad, numeroControl, curp,
              fechaNacimiento, telefono, semestreActual,
              direccion, fechaIngreso, fechaCreacion, fechaEdicion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            estudianteData,
          );

          logger.info(
            `Estudiante insertado correctamente con ID: ${resultEstudiante.insertId}`,
          );

          resultados.exitosos.push({
            numeroControl: alumno.estudiante.numeroControl,
            nombre: `${alumno.usuario.nombre} ${alumno.usuario.apellidoPaterno}`,
            accion: "creado",
          });
        }
      } catch (error) {
        logger.error(`Error procesando alumno ${i + 1}:`, {
          message: error.message,
          stack: error.stack,
          alumno: {
            usuario: alumno.usuario?.email,
            numeroControl: alumno.estudiante?.numeroControl,
          },
        });
        resultados.fallidos.push({
          indice: i + 1,
          numeroControl: alumno.estudiante?.numeroControl || "N/A",
          nombre: alumno.usuario?.nombre || "N/A",
          error: error.message,
        });
      }
    }

    await connection.commit();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Proceso completado: ${resultados.exitosos.length} exitosos, ${resultados.fallidos.length} fallidos`,
      data: resultados,
    });
  } catch (error) {
    await connection.rollback();
    logger.error("Error en carga masiva:", error);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error al procesar la carga masiva",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};
