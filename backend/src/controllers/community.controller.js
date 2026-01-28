const { StatusCodes } = require("http-status-codes");
const { pool } = require("../config/db.config");
const logger = require("../utils/logger");

exports.getDocentes = async (req, res, next) => {
  try {
    const [docentes] = await pool.query(
      `SELECT
        u.idUsuario as id,
        u.nombre,
        u.apellidoPaterno,
        u.apellidoMaterno,
        u.email,
        NULL as telefono,
        NULL as numeroEmpleado,
        NULL as especialidad,
        u.activo,
        u.fechaCreacion as fechaContratacion
      FROM usuarios u
      WHERE u.activo = true AND u.tipoUsuario = 'docente'
      ORDER BY u.nombre ASC`,
    );

    res.status(StatusCodes.OK).json({
      success: true,
      count: docentes.length,
      data: docentes,
    });
  } catch (error) {
    logger.error(`Error al obtener docentes: ${error.message}`);
    next(error);
  }
};

exports.createDocente = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      email,
      telefono,
      fechaNacimiento,
      curp,
      numeroEmpleado,
      especialidad,
      fechaContratacion,
    } = req.body;

    // Verificar si el email ya existe
    const [existingEmail] = await connection.query(
      "SELECT idUsuario FROM usuarios WHERE email = ?",
      [email],
    );

    if (existingEmail.length > 0) {
      await connection.rollback();
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "El email ya está registrado",
      });
    }

    // Verificar si el número de empleado ya existe
    const [existingEmployee] = await connection.query(
      "SELECT idDocente FROM docentes WHERE numeroEmpleado = ?",
      [numeroEmpleado],
    );

    if (existingEmployee.length > 0) {
      await connection.rollback();
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "El número de empleado ya está registrado",
      });
    }

    // Determinar contraseña: usar la proporcionada o generar una temporal (CURP sin los últimos 4 dígitos)
    const bcrypt = require("bcryptjs");
    const rawPassword = String(req.body.password || "").trim();
    if (!rawPassword) {
      await connection.rollback();
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "La contraseña es requerida",
      });
    }
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Crear el usuario
    const [userResult] = await connection.query(
      `INSERT INTO usuarios (
        nombre, apellidoPaterno, apellidoMaterno, email, password,
        telefono, fechaNacimiento, curp, numeroEmpleado, tipoUsuario, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'docente', true)`,
      [
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        email,
        hashedPassword,
        telefono || null,
        fechaNacimiento,
        curp,
        numeroEmpleado,
      ],
    );

    const idUsuario = userResult.insertId;

    // Crear el docente
    const [docenteResult] = await connection.query(
      `INSERT INTO docentes (
        idUsuario, especialidad, numeroEmpleado, telefono, fechaContratacion
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        idUsuario,
        especialidad,
        numeroEmpleado,
        telefono || null,
        fechaContratacion,
      ],
    );

    await connection.commit();

    // Obtener el docente creado
    const [nuevoDocente] = await connection.query(
      `SELECT 
        d.idDocente as id,
        u.nombre,
        u.apellidoPaterno,
        u.apellidoMaterno,
        u.email,
        d.telefono,
        u.fechaNacimiento,
        u.curp,
        d.numeroEmpleado,
        d.especialidad,
        u.activo,
        d.fechaContratacion
      FROM docentes d
      INNER JOIN usuarios u ON d.idUsuario = u.idUsuario
      WHERE d.idDocente = ?`,
      [docenteResult.insertId],
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: nuevoDocente[0],
    });
  } catch (error) {
    await connection.rollback();
    logger.error(`Error al crear docente: ${error.message}`);
    next(error);
  } finally {
    connection.release();
  }
};

// ===== ALUMNOS =====

exports.getAlumnos = async (req, res, next) => {
  try {
    const [alumnos] = await pool.query(
      `SELECT 
        e.idEstudiante as id,
        u.nombre,
        u.apellidoPaterno,
        u.apellidoMaterno,
        u.email,
        e.telefono,
        e.fechaNacimiento,
        e.curp,
        e.numeroControl as matricula,
        e.idEspecialidad,
        esp.nombre as especialidad,
        e.semestreActual as semestre,
        u.grupo as grupo,
        g.idGrupo as idGrupo,
        u.activo,
        e.direccion,
        e.fechaIngreso
      FROM estudiantes e
      INNER JOIN usuarios u ON e.idUsuario = u.idUsuario
      INNER JOIN especialidades esp ON e.idEspecialidad = esp.idEspecialidad
      LEFT JOIN grupos g ON u.grupo COLLATE utf8mb4_unicode_ci = g.codigo COLLATE utf8mb4_unicode_ci 
        AND g.semestre = e.semestreActual 
        AND g.idEspecialidad = e.idEspecialidad
      WHERE u.activo = true
      ORDER BY u.nombre ASC`,
    );

    res.status(StatusCodes.OK).json({
      success: true,
      count: alumnos.length,
      data: alumnos,
    });
  } catch (error) {
    logger.error(`Error al obtener alumnos: ${error.message}`);
    next(error);
  }
};

exports.createAlumno = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      email,
      telefono,
      fechaNacimiento,
      curp,
      numeroControl,
      idEspecialidad,
      idGrupo,
      direccion,
      semestreActual,
      fechaIngreso,
    } = req.body;

    // Verificar si el email ya existe
    const [existingEmail] = await connection.query(
      "SELECT idUsuario FROM usuarios WHERE email = ?",
      [email],
    );

    if (existingEmail.length > 0) {
      await connection.rollback();
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "El email ya está registrado",
      });
    }

    // Verificar si el número de control ya existe
    const [existingControl] = await connection.query(
      "SELECT idEstudiante FROM estudiantes WHERE numeroControl = ?",
      [numeroControl],
    );

    if (existingControl.length > 0) {
      await connection.rollback();
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "El número de control ya está registrado",
      });
    }

    // Verificar si la CURP ya existe
    const [existingCurp] = await connection.query(
      "SELECT idEstudiante FROM estudiantes WHERE curp = ?",
      [curp],
    );

    if (existingCurp.length > 0) {
      await connection.rollback();
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "La CURP ya está registrada",
      });
    }

    // Determinar contraseña: usar la proporcionada o generar temporal (número de control)
    const bcrypt = require("bcryptjs");
    const rawPasswordAlumno = String(req.body.password || "").trim();
    if (!rawPasswordAlumno) {
      await connection.rollback();
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "La contraseña es requerida",
      });
    }
    const hashedPassword = await bcrypt.hash(rawPasswordAlumno, 10);

    // Si se proporciona un grupo, validar que pertenezca a la misma especialidad
    let codigoGrupo = null;
    if (idGrupo && idGrupo !== 0) {
      const [grupoData] = await connection.query(
        "SELECT idEspecialidad, codigo FROM grupos WHERE idGrupo = ?",
        [idGrupo],
      );

      if (grupoData.length === 0) {
        await connection.rollback();
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "El grupo seleccionado no existe",
        });
      }

      if (grupoData[0].idEspecialidad !== idEspecialidad) {
        await connection.rollback();
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message:
            "El grupo debe pertenecer a la misma especialidad del alumno",
        });
      }

      codigoGrupo = grupoData[0].codigo;
    }

    // Crear el usuario
    const [userResult] = await connection.query(
      `INSERT INTO usuarios (
        nombre, apellidoPaterno, apellidoMaterno, email, password,
        fechaNacimiento, tipoUsuario, activo, grupo
      ) VALUES (?, ?, ?, ?, ?, ?, 'alumno', true, ?)`,
      [
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        email,
        hashedPassword,
        fechaNacimiento,
        codigoGrupo,
      ],
    );

    const idUsuario = userResult.insertId;

    // Generar código QR único
    const codigoQr = `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Crear el estudiante
    await connection.query(
      `INSERT INTO estudiantes (
        idUsuario, idEspecialidad, numeroControl, curp, fechaNacimiento,
        direccion, telefono, semestreActual, codigoQr, fechaIngreso
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idUsuario,
        idEspecialidad,
        numeroControl,
        curp,
        fechaNacimiento,
        direccion || null,
        telefono || null,
        semestreActual,
        codigoQr,
        fechaIngreso || null, // Convertir cadena vacía a NULL
      ],
    );

    await connection.commit();

    // Obtener el alumno creado
    const [nuevoAlumno] = await connection.query(
      `SELECT 
        e.idEstudiante as id,
        u.nombre,
        u.apellidoPaterno,
        u.apellidoMaterno,
        u.email,
        e.telefono,
        e.fechaNacimiento,
        e.curp,
        e.numeroControl as matricula,
        esp.nombre as especialidad,
        e.semestreActual as semestre,
        u.activo,
        e.direccion,
        e.fechaIngreso
      FROM estudiantes e
      INNER JOIN usuarios u ON e.idUsuario = u.idUsuario
      INNER JOIN especialidades esp ON e.idEspecialidad = esp.idEspecialidad
      WHERE e.idEstudiante = ?`,
      [userResult.insertId],
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: nuevoAlumno[0],
    });
  } catch (error) {
    await connection.rollback();
    logger.error(`Error al crear alumno: ${error.message}`);
    next(error);
  } finally {
    connection.release();
  }
};

// ===== ADMINISTRADORES =====

// @desc    Obtener todos los administradores
// @route   GET /api/v1/community/administradores
// @access  Private
exports.getAdministradores = async (req, res, next) => {
  try {
    const [administradores] = await pool.query(
      `SELECT 
        u.idUsuario as id,
        u.nombre,
        u.apellidoPaterno,
        u.apellidoMaterno,
        u.email,
        NULL as telefono,
        NULL as numeroEmpleado,
        NULL as cargo,
        u.activo,
        u.fechaCreacion as fechaContratacion
      FROM usuarios u
      WHERE u.activo = true AND u.tipoUsuario = 'administrador'
      ORDER BY u.nombre ASC`,
    );

    res.status(StatusCodes.OK).json({
      success: true,
      count: administradores.length,
      data: administradores,
    });
  } catch (error) {
    logger.error(`Error al obtener administradores: ${error.message}`);
    next(error);
  }
};

// @desc    Crear un nuevo administrador
// @route   POST /api/v1/community/administradores
// @access  Private
exports.createAdministrador = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      email,
      telefono,
      fechaNacimiento,
      curp,
      numeroEmpleado,
      cargo,
      fechaContratacion,
    } = req.body;

    // Verificar si el email ya existe
    const [existingEmail] = await connection.query(
      "SELECT idUsuario FROM usuarios WHERE email = ?",
      [email],
    );

    if (existingEmail.length > 0) {
      await connection.rollback();
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "El email ya está registrado",
      });
    }

    // Verificar si el número de empleado ya existe
    const [existingEmployee] = await connection.query(
      "SELECT idAdministrador FROM administradores WHERE numeroEmpleado = ?",
      [numeroEmpleado],
    );

    if (existingEmployee.length > 0) {
      await connection.rollback();
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "El número de empleado ya está registrado",
      });
    }

    // Determinar contraseña
    const bcrypt = require("bcryptjs");
    const rawPasswordAdmin = String(req.body.password || "").trim();
    if (!rawPasswordAdmin) {
      await connection.rollback();
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "La contraseña es requerida",
      });
    }
    const hashedPassword = await bcrypt.hash(rawPasswordAdmin, 10);

    // Crear el usuario
    const [userResult] = await connection.query(
      `INSERT INTO usuarios (
        nombre, apellidoPaterno, apellidoMaterno, email, password,
        fechaNacimiento, curp, tipoUsuario, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'admin', true)`,
      [
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        email,
        hashedPassword,
        fechaNacimiento,
        curp,
      ],
    );

    const idUsuario = userResult.insertId;

    // Crear el administrador en la tabla administradores
    const [adminResult] = await connection.query(
      `INSERT INTO administradores (
        idUsuario, numeroEmpleado, cargo, telefono, fechaContratacion, activo
      ) VALUES (?, ?, ?, ?, ?, true)`,
      [
        idUsuario,
        numeroEmpleado,
        cargo,
        telefono || null,
        fechaContratacion || null,
      ],
    );

    await connection.commit();

    // Obtener el administrador creado
    const [nuevoAdmin] = await connection.query(
      `SELECT 
        a.idAdministrador as id,
        u.nombre,
        u.apellidoPaterno,
        u.apellidoMaterno,
        u.email,
        a.telefono,
        u.fechaNacimiento,
        u.curp,
        a.numeroEmpleado,
        a.cargo,
        u.activo,
        a.fechaContratacion
      FROM administradores a
      INNER JOIN usuarios u ON a.idUsuario = u.idUsuario
      WHERE a.idAdministrador = ?`,
      [adminResult.insertId],
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: nuevoAdmin[0],
    });
  } catch (error) {
    await connection.rollback();
    logger.error(`Error al crear administrador: ${error.message}`);
    next(error);
  } finally {
    connection.release();
  }
};

// ===== ESPECIALIDADES =====

// @desc    Obtener todas las especialidades
// @route   GET /api/v1/community/especialidades
// @access  Private
exports.getEspecialidades = async (req, res, next) => {
  try {
    const [especialidades] = await pool.query(
      `SELECT 
        idEspecialidad as id,
        nombre,
        codigo,
        activo
      FROM especialidades 
      WHERE activo = true
      ORDER BY nombre ASC`,
    );

    res.status(StatusCodes.OK).json({
      success: true,
      count: especialidades.length,
      data: especialidades,
    });
  } catch (error) {
    logger.error(`Error al obtener especialidades: ${error.message}`);
    next(error);
  }
};

// @desc    Crear una nueva especialidad
// @route   POST /api/v1/community/especialidades
// @access  Private
exports.createEspecialidad = async (req, res, next) => {
  try {
    const { nombre, codigo } = req.body;

    // Validar duplicados por codigo o nombre
    const [existing] = await pool.query(
      "SELECT idEspecialidad FROM especialidades WHERE codigo = ? OR nombre = ? LIMIT 1",
      [codigo, nombre],
    );
    if (existing.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Ya existe una especialidad con ese nombre o código",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO especialidades (nombre, codigo, activo) VALUES (?, ?, true)`,
      [nombre, codigo],
    );

    const [created] = await pool.query(
      `SELECT idEspecialidad as id, nombre, codigo, activo FROM especialidades WHERE idEspecialidad = ?`,
      [result.insertId],
    );

    res.status(StatusCodes.CREATED).json({ success: true, data: created[0] });
  } catch (error) {
    logger.error(`Error al crear especialidad: ${error.message}`);
    next(error);
  }
};

// @desc    Actualizar una especialidad
// @route   PUT /api/v1/community/especialidades/:id
// @access  Private
exports.updateEspecialidad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, activo } = req.body;

    // Verificar que la especialidad existe
    const [existing] = await pool.query(
      "SELECT idEspecialidad FROM especialidades WHERE idEspecialidad = ?",
      [id],
    );
    if (existing.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Especialidad no encontrada",
      });
    }

    // Validar duplicados por codigo o nombre (excluyendo la especialidad actual)
    if (nombre || codigo) {
      const [duplicates] = await pool.query(
        "SELECT idEspecialidad FROM especialidades WHERE (codigo = ? OR nombre = ?) AND idEspecialidad != ? LIMIT 1",
        [codigo || "", nombre || "", id],
      );
      if (duplicates.length > 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Ya existe otra especialidad con ese nombre o código",
        });
      }
    }

    // Actualizar la especialidad
    await pool.query(
      `UPDATE especialidades SET 
        nombre = COALESCE(?, nombre),
        codigo = COALESCE(?, codigo),
        activo = COALESCE(?, activo)
      WHERE idEspecialidad = ?`,
      [nombre, codigo, activo, id],
    );

    // Obtener la especialidad actualizada
    const [updated] = await pool.query(
      `SELECT idEspecialidad as id, nombre, codigo, activo FROM especialidades WHERE idEspecialidad = ?`,
      [id],
    );

    res.status(StatusCodes.OK).json({ success: true, data: updated[0] });
  } catch (error) {
    logger.error(`Error al actualizar especialidad: ${error.message}`);
    next(error);
  }
};

// @desc    Eliminar una especialidad
// @route   DELETE /api/v1/community/especialidades/:id
// @access  Private
exports.deleteEspecialidad = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que la especialidad existe
    const [existing] = await pool.query(
      "SELECT idEspecialidad FROM especialidades WHERE idEspecialidad = ?",
      [id],
    );
    if (existing.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Especialidad no encontrada",
      });
    }

    // Soft delete: actualizar activo a false
    await pool.query(
      "UPDATE especialidades SET activo = false WHERE idEspecialidad = ?",
      [id],
    );

    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    logger.error(`Error al eliminar especialidad: ${error.message}`);
    next(error);
  }
};

// ===== FUNCIONES INDIVIDUALES =====

// @desc    Obtener un docente por ID
// @route   GET /api/v1/community/docentes/:id
// @access  Private
exports.getDocente = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [docente] = await pool.query(
      `SELECT 
        d.idDocente as id,
        u.nombre,
        u.apellidoPaterno,
        u.apellidoMaterno,
        u.email,
        d.telefono,
        u.fechaNacimiento,
        u.curp,
        d.numeroEmpleado,
        d.especialidad,
        u.activo,
        d.fechaContratacion
      FROM docentes d
      INNER JOIN usuarios u ON d.idUsuario = u.idUsuario
      WHERE d.idDocente = ? AND u.activo = true`,
      [id],
    );

    if (docente.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Docente no encontrado",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: docente[0],
    });
  } catch (error) {
    logger.error(`Error al obtener docente: ${error.message}`);
    next(error);
  }
};

// @desc    Actualizar un docente
// @route   PUT /api/v1/community/docentes/:id
// @access  Private
exports.updateDocente = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      email,
      telefono,
      fechaNacimiento,
      curp,
      numeroEmpleado,
      especialidad,
      fechaContratacion,
      activo,
    } = req.body;

    const [rows] = await connection.query(
      `SELECT d.idUsuario FROM docentes d WHERE d.idDocente = ?`,
      [id],
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Docente no encontrado" });
    }
    const idUsuario = rows[0].idUsuario;

    // Actualizar usuarios
    await connection.query(
      `UPDATE usuarios SET 
        nombre = COALESCE(?, nombre),
        apellidoPaterno = COALESCE(?, apellidoPaterno),
        apellidoMaterno = COALESCE(?, apellidoMaterno),
        email = COALESCE(?, email),
        telefono = COALESCE(?, telefono),
        fechaNacimiento = COALESCE(?, fechaNacimiento),
        curp = COALESCE(?, curp),
        numeroEmpleado = COALESCE(?, numeroEmpleado),
        activo = COALESCE(?, activo)
      WHERE idUsuario = ?`,
      [
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        email,
        telefono,
        fechaNacimiento,
        curp,
        numeroEmpleado,
        activo,
        idUsuario,
      ],
    );

    // Actualizar docentes
    await connection.query(
      `UPDATE docentes SET 
        telefono = COALESCE(?, telefono),
        numeroEmpleado = COALESCE(?, numeroEmpleado),
        especialidad = COALESCE(?, especialidad),
        fechaContratacion = COALESCE(?, fechaContratacion)
      WHERE idDocente = ?`,
      [telefono, numeroEmpleado, especialidad, fechaContratacion, id],
    );

    await connection.commit();

    return res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    await connection.rollback();
    logger.error(`Error al actualizar docente: ${error.message}`);
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Eliminar un docente
// @route   DELETE /api/v1/community/docentes/:id
// @access  Private
exports.deleteDocente = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    const [rows] = await connection.query(
      `SELECT d.idUsuario FROM docentes d WHERE d.idDocente = ?`,
      [id],
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Docente no encontrado" });
    }
    const idUsuario = rows[0].idUsuario;

    await connection.query(
      `UPDATE usuarios SET activo = false WHERE idUsuario = ?`,
      [idUsuario],
    );
    await connection.commit();
    return res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    await connection.rollback();
    logger.error(`Error al eliminar docente: ${error.message}`);
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Obtener un alumno por ID
// @route   GET /api/v1/community/alumnos/:id
// @access  Private
exports.getAlumno = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [alumno] = await pool.query(
      `SELECT 
        e.idEstudiante as id,
        u.nombre,
        u.apellidoPaterno,
        u.apellidoMaterno,
        u.email,
        e.telefono,
        e.fechaNacimiento,
        e.curp,
        e.numeroControl as matricula,
        esp.nombre as especialidad,
        e.semestreActual as semestre,
        u.activo,
        e.direccion,
        e.fechaIngreso
      FROM estudiantes e
      INNER JOIN usuarios u ON e.idUsuario = u.idUsuario
      INNER JOIN especialidades esp ON e.idEspecialidad = esp.idEspecialidad
      WHERE e.idEstudiante = ? AND u.activo = true`,
      [id],
    );

    if (alumno.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Alumno no encontrado",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: alumno[0],
    });
  } catch (error) {
    logger.error(`Error al obtener alumno: ${error.message}`);
    next(error);
  }
};

exports.updateAlumno = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      email,
      telefono,
      fechaNacimiento,
      curp,
      numeroControl,
      idEspecialidad,
      idGrupo,
      direccion,
      semestreActual,
      fechaIngreso,
      activo,
    } = req.body;

    const [rows] = await connection.query(
      `SELECT e.idUsuario, e.idEspecialidad FROM estudiantes e WHERE e.idEstudiante = ?`,
      [id],
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Alumno no encontrado" });
    }
    const idUsuario = rows[0].idUsuario;
    const especialidadActual = idEspecialidad || rows[0].idEspecialidad;

    logger.info(
      `idUsuario: ${idUsuario}, especialidadActual: ${especialidadActual}`,
    );
    logger.info(`idGrupo recibido: ${idGrupo} (tipo: ${typeof idGrupo})`);

    // Si se proporciona un grupo, validar que pertenezca a la misma especialidad
    let codigoGrupo = null;
    if (idGrupo && idGrupo !== 0) {
      const [grupoData] = await connection.query(
        "SELECT idEspecialidad, codigo FROM grupos WHERE idGrupo = ?",
        [idGrupo],
      );

      if (grupoData.length === 0) {
        await connection.rollback();
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "El grupo seleccionado no existe",
        });
      }

      if (grupoData[0].idEspecialidad !== especialidadActual) {
        await connection.rollback();
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message:
            "El grupo debe pertenecer a la misma especialidad del alumno",
        });
      }

      codigoGrupo = grupoData[0].codigo;
    } else if (idGrupo === 0) {
      // Si se envía 0, significa que se quiere quitar el grupo
      codigoGrupo = null;
    }

    const updateUsuarioQuery = `UPDATE usuarios SET 
        nombre = COALESCE(?, nombre),
        apellidoPaterno = COALESCE(?, apellidoPaterno),
        apellidoMaterno = COALESCE(?, apellidoMaterno),
        email = COALESCE(?, email),
        fechaNacimiento = COALESCE(?, fechaNacimiento),
        activo = COALESCE(?, activo),
        grupo = ${codigoGrupo !== undefined ? "?" : "grupo"}
      WHERE idUsuario = ?`;

    const updateUsuarioParams =
      codigoGrupo !== undefined
        ? [
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            email,
            fechaNacimiento,
            activo,
            codigoGrupo,
            idUsuario,
          ]
        : [
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            email,
            fechaNacimiento,
            activo,
            idUsuario,
          ];

    await connection.query(updateUsuarioQuery, updateUsuarioParams);

    // Actualizar estudiante
    const updateEstudianteQuery = `UPDATE estudiantes SET 
        telefono = COALESCE(?, telefono),
        curp = COALESCE(?, curp),
        numeroControl = COALESCE(?, numeroControl),
        idEspecialidad = COALESCE(?, idEspecialidad),
        direccion = COALESCE(?, direccion),
        semestreActual = COALESCE(?, semestreActual),
        fechaIngreso = COALESCE(?, fechaIngreso)
      WHERE idEstudiante = ?`;

    const updateEstudianteParams = [
      telefono,
      curp,
      numeroControl,
      idEspecialidad,
      direccion,
      semestreActual,
      fechaIngreso,
      id,
    ];

    await connection.query(updateEstudianteQuery, updateEstudianteParams);

    await connection.commit();
    logger.info(`✅ Alumno ${id} actualizado exitosamente`);
    return res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    await connection.rollback();
    logger.error(`Error al actualizar alumno: ${error.message}`);
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Eliminar un alumno
// @route   DELETE /api/v1/community/alumnos/:id
// @access  Private
exports.deleteAlumno = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const [rows] = await connection.query(
      `SELECT e.idUsuario FROM estudiantes e WHERE e.idEstudiante = ?`,
      [id],
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Alumno no encontrado" });
    }
    const idUsuario = rows[0].idUsuario;
    await connection.query(
      `UPDATE usuarios SET activo = false WHERE idUsuario = ?`,
      [idUsuario],
    );
    await connection.commit();
    return res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    await connection.rollback();
    logger.error(`Error al eliminar alumno: ${error.message}`);
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Obtener un administrador por ID
// @route   GET /api/v1/community/administradores/:id
// @access  Private
exports.getAdministrador = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [admin] = await pool.query(
      `SELECT 
        a.idAdministrador as id,
        u.nombre,
        u.apellidoPaterno,
        u.apellidoMaterno,
        u.email,
        a.telefono,
        u.fechaNacimiento,
        u.curp,
        a.numeroEmpleado,
        a.cargo,
        u.activo,
        a.fechaContratacion
      FROM administradores a
      INNER JOIN usuarios u ON a.idUsuario = u.idUsuario
      WHERE a.idAdministrador = ? AND u.activo = true`,
      [id],
    );

    if (admin.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Administrador no encontrado",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: admin[0],
    });
  } catch (error) {
    logger.error(`Error al obtener administrador: ${error.message}`);
    next(error);
  }
};

// @desc    Actualizar un administrador
// @route   PUT /api/v1/community/administradores/:id
// @access  Private
exports.updateAdministrador = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      email,
      telefono,
      fechaNacimiento,
      curp,
      numeroEmpleado,
      cargo,
      fechaContratacion,
      activo,
    } = req.body;

    // Obtener el idUsuario del administrador
    const [admin] = await connection.query(
      "SELECT idUsuario FROM administradores WHERE idAdministrador = ?",
      [id],
    );

    if (admin.length === 0) {
      await connection.rollback();
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Administrador no encontrado",
      });
    }

    const idUsuario = admin[0].idUsuario;

    // Actualizar tabla usuarios
    await connection.query(
      `UPDATE usuarios SET 
        nombre = COALESCE(?, nombre),
        apellidoPaterno = COALESCE(?, apellidoPaterno),
        apellidoMaterno = COALESCE(?, apellidoMaterno),
        email = COALESCE(?, email),
        fechaNacimiento = COALESCE(?, fechaNacimiento),
        curp = COALESCE(?, curp),
        activo = COALESCE(?, activo)
      WHERE idUsuario = ?`,
      [
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        email,
        fechaNacimiento,
        curp,
        activo,
        idUsuario,
      ],
    );

    // Actualizar tabla administradores
    await connection.query(
      `UPDATE administradores SET 
        numeroEmpleado = COALESCE(?, numeroEmpleado),
        cargo = COALESCE(?, cargo),
        telefono = COALESCE(?, telefono),
        fechaContratacion = COALESCE(?, fechaContratacion),
        activo = COALESCE(?, activo)
      WHERE idAdministrador = ?`,
      [numeroEmpleado, cargo, telefono, fechaContratacion, activo, id],
    );

    await connection.commit();
    return res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    await connection.rollback();
    logger.error(`Error al actualizar administrador: ${error.message}`);
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Eliminar un administrador
// @route   DELETE /api/v1/community/administradores/:id
// @access  Private
exports.deleteAdministrador = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Obtener el idUsuario
    const [admin] = await connection.query(
      "SELECT idUsuario FROM administradores WHERE idAdministrador = ?",
      [id],
    );

    if (admin.length === 0) {
      await connection.rollback();
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Administrador no encontrado",
      });
    }

    const idUsuario = admin[0].idUsuario;

    // Desactivar en ambas tablas
    await connection.query(
      "UPDATE administradores SET activo = false WHERE idAdministrador = ?",
      [id],
    );
    await connection.query(
      "UPDATE usuarios SET activo = false WHERE idUsuario = ?",
      [idUsuario],
    );

    await connection.commit();
    return res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    await connection.rollback();
    logger.error(`Error al eliminar administrador: ${error.message}`);
    next(error);
  } finally {
    connection.release();
  }
};

// ===== GRUPOS =====

// @desc    Obtener todos los grupos
// @route   GET /api/v1/community/grupos
// @access  Private
exports.getGrupos = async (req, res, next) => {
  try {
    const { especialidad, periodo } = req.query;

    const params = [];
    let where = "WHERE g.activo = true";

    if (especialidad) {
      where += " AND (esp.codigo = ? OR esp.idEspecialidad = ?)";
      params.push(
        especialidad,
        Number.isNaN(Number(especialidad)) ? 0 : Number(especialidad),
      );
    }

    if (periodo) {
      where += " AND g.idPeriodo = ?";
      params.push(periodo);
    }

    const [grupos] = await pool.query(
      `SELECT 
        g.idGrupo as id,
        g.codigo,
        g.semestre,
        g.aula,
        g.idEspecialidad,
        g.idPeriodo,
        g.idDocente,
        g.idMateria,
        esp.nombre as especialidadNombre,
        esp.codigo as especialidadCodigo,
        CONCAT(u.nombre, ' ', u.apellidoPaterno, ' ', COALESCE(u.apellidoMaterno, '')) as docenteNombre,
        m.nombre as materiaNombre,
        g.activo,
        g.fechaCreacion,
        g.fechaEdicion,
        0 as integrantes
      FROM grupos g
      INNER JOIN especialidades esp ON g.idEspecialidad = esp.idEspecialidad
      LEFT JOIN usuarios u ON g.idDocente = u.idUsuario AND u.tipoUsuario = 'docente'
      LEFT JOIN materias m ON g.idMateria = m.idMateria
      ${where}
      ORDER BY g.semestre ASC, g.codigo ASC`,
      params,
    );

    res.status(StatusCodes.OK).json({
      success: true,
      count: grupos.length,
      data: grupos,
    });
  } catch (error) {
    logger.error(`Error al obtener grupos: ${error.message}`);
    next(error);
  }
};

// @desc    Crear un nuevo grupo
// @route   POST /api/v1/community/grupos
// @access  Private
exports.createGrupo = async (req, res, next) => {
  try {
    const {
      codigo,
      semestre,
      aula,
      idEspecialidad,
      idPeriodo,
      idDocente,
      idMateria,
    } = req.body;

    // Validar campos requeridos
    if (
      !codigo ||
      !semestre ||
      !idEspecialidad ||
      !idPeriodo ||
      !idDocente ||
      !idMateria
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Faltan campos requeridos",
      });
    }

    // Verificar si el código ya existe en el mismo periodo
    const [existing] = await pool.query(
      "SELECT idGrupo FROM grupos WHERE codigo = ? AND idPeriodo = ? LIMIT 1",
      [codigo, idPeriodo],
    );

    if (existing.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "El código de grupo ya existe en este periodo",
      });
    }

    // Crear el grupo
    const [result] = await pool.query(
      `INSERT INTO grupos (idPeriodo, idDocente, idMateria, idEspecialidad, codigo, semestre, aula, activo, fechaCreacion, fechaEdicion)
       VALUES (?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())`,
      [
        idPeriodo,
        idDocente,
        idMateria,
        idEspecialidad,
        codigo,
        semestre,
        aula || null,
      ],
    );

    // Obtener el grupo creado con todas las relaciones
    const [nuevoGrupo] = await pool.query(
      `SELECT 
        g.idGrupo as id,
        g.codigo,
        g.semestre,
        g.aula,
        g.idEspecialidad,
        g.idPeriodo,
        g.idDocente,
        g.idMateria,
        esp.nombre as especialidadNombre,
        esp.codigo as especialidadCodigo,
        CONCAT(u.nombre, ' ', u.apellidoPaterno, ' ', COALESCE(u.apellidoMaterno, '')) as docenteNombre,
        m.nombre as materiaNombre,
        g.activo,
        g.fechaCreacion,
        g.fechaEdicion,
        0 as integrantes
      FROM grupos g
      INNER JOIN especialidades esp ON g.idEspecialidad = esp.idEspecialidad
      LEFT JOIN usuarios u ON g.idDocente = u.idUsuario AND u.tipoUsuario = 'docente'
      LEFT JOIN materias m ON g.idMateria = m.idMateria
      WHERE g.idGrupo = ?`,
      [result.insertId],
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: nuevoGrupo[0],
    });
  } catch (error) {
    logger.error(`Error al crear grupo: ${error.message}`);
    next(error);
  }
};

// @desc    Obtener un grupo por ID
// @route   GET /api/v1/community/grupos/:id
// @access  Private
exports.getGrupo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [grupo] = await pool.query(
      `SELECT 
        g.idGrupo as id,
        g.codigo,
        g.semestre,
        g.aula,
        g.idEspecialidad,
        g.idPeriodo,
        g.idDocente,
        g.idMateria,
        esp.nombre as especialidadNombre,
        esp.codigo as especialidadCodigo,
        CONCAT(u.nombre, ' ', u.apellidoPaterno, ' ', COALESCE(u.apellidoMaterno, '')) as docenteNombre,
        m.nombre as materiaNombre,
        g.activo,
        g.fechaCreacion,
        g.fechaEdicion,
        0 as integrantes
      FROM grupos g
      INNER JOIN especialidades esp ON g.idEspecialidad = esp.idEspecialidad
      LEFT JOIN usuarios u ON g.idDocente = u.idUsuario AND u.tipoUsuario = 'docente'
      LEFT JOIN materias m ON g.idMateria = m.idMateria
      WHERE g.idGrupo = ? AND g.activo = true`,
      [id],
    );

    if (grupo.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Grupo no encontrado",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: grupo[0],
    });
  } catch (error) {
    logger.error(`Error al obtener grupo: ${error.message}`);
    next(error);
  }
};

// @desc    Actualizar un grupo
// @route   PUT /api/v1/community/grupos/:id
// @access  Private
exports.updateGrupo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      semestre,
      aula,
      idEspecialidad,
      idPeriodo,
      idDocente,
      idMateria,
      activo,
    } = req.body;

    // Verificar que el grupo existe
    const [existing] = await pool.query(
      "SELECT idGrupo, idPeriodo FROM grupos WHERE idGrupo = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Grupo no encontrado",
      });
    }

    // Si se cambia el código, verificar que no exista en el periodo
    if (codigo) {
      const periodoActual = idPeriodo || existing[0].idPeriodo;
      const [duplicate] = await pool.query(
        "SELECT idGrupo FROM grupos WHERE codigo = ? AND idPeriodo = ? AND idGrupo != ?",
        [codigo, periodoActual, id],
      );

      if (duplicate.length > 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "El código de grupo ya existe en este periodo",
        });
      }
    }

    // Actualizar el grupo
    await pool.query(
      `UPDATE grupos SET 
        codigo = COALESCE(?, codigo),
        semestre = COALESCE(?, semestre),
        aula = COALESCE(?, aula),
        idEspecialidad = COALESCE(?, idEspecialidad),
        idPeriodo = COALESCE(?, idPeriodo),
        idDocente = COALESCE(?, idDocente),
        idMateria = COALESCE(?, idMateria),
        activo = COALESCE(?, activo),
        fechaEdicion = CURRENT_TIMESTAMP(3)
      WHERE idGrupo = ?`,
      [
        codigo,
        semestre,
        aula,
        idEspecialidad,
        idPeriodo,
        idDocente,
        idMateria,
        activo,
        id,
      ],
    );

    // Obtener el grupo actualizado
    const [updated] = await pool.query(
      `SELECT 
        g.idGrupo as id,
        g.codigo,
        g.semestre,
        g.aula,
        g.idEspecialidad,
        g.idPeriodo,
        g.idDocente,
        g.idMateria,
        esp.nombre as especialidadNombre,
        esp.codigo as especialidadCodigo,
        CONCAT(u.nombre, ' ', u.apellidoPaterno, ' ', COALESCE(u.apellidoMaterno, '')) as docenteNombre,
        m.nombre as materiaNombre,
        g.activo,
        g.fechaCreacion,
        g.fechaEdicion,
        0 as integrantes
      FROM grupos g
      INNER JOIN especialidades esp ON g.idEspecialidad = esp.idEspecialidad
      LEFT JOIN usuarios u ON g.idDocente = u.idUsuario AND u.tipoUsuario = 'docente'
      LEFT JOIN materias m ON g.idMateria = m.idMateria
      WHERE g.idGrupo = ?`,
      [id],
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: updated[0],
    });
  } catch (error) {
    logger.error(`Error al actualizar grupo: ${error.message}`);
    next(error);
  }
};

// @desc    Eliminar un grupo (soft delete)
// @route   DELETE /api/v1/community/grupos/:id
// @access  Private
exports.deleteGrupo = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el grupo existe
    const [existing] = await pool.query(
      "SELECT idGrupo FROM grupos WHERE idGrupo = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Grupo no encontrado",
      });
    }

    // Soft delete
    await pool.query(
      "UPDATE grupos SET activo = false, fechaEdicion = CURRENT_TIMESTAMP(3) WHERE idGrupo = ?",
      [id],
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Grupo eliminado correctamente",
    });
  } catch (error) {
    logger.error(`Error al eliminar grupo: ${error.message}`);
    next(error);
  }
};
