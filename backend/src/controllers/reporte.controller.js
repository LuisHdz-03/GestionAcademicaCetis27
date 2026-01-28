const { StatusCodes } = require('http-status-codes');
const { pool } = require('../config/db.config');
const logger = require('../utils/logger');

// @desc    Obtener todos los reportes
// @route   GET /api/v1/reportes
// @access  Private
exports.getReportes = async (req, res, next) => {
  try {
    const { limit = 10, offset = 0, estatus } = req.query;

    let where = 'WHERE 1=1';
    const params = [];

    if (estatus !== undefined) {
      where += ' AND r.estatus = ?';
      params.push(estatus);
    }

    const [reportes] = await pool.query(
      `SELECT 
        r.*,
        e.idEstudiante,
        CONCAT(ue.nombre, ' ', ue.apellidoPaterno, ' ', COALESCE(ue.apellidoMaterno, '')) as nombreEstudiante,
        e.numeroControl as matriculaEstudiante,
        esp.nombre as especialidadEstudiante,
        g.codigo as grupoEstudiante,
        d.idDocente,
        CONCAT(ud.nombre, ' ', ud.apellidoPaterno, ' ', COALESCE(ud.apellidoMaterno, '')) as nombreDocente
      FROM reportes r
      LEFT JOIN estudiantes e ON r.idEstudiante = e.idEstudiante
      LEFT JOIN usuarios ue ON e.idUsuario = ue.idUsuario
      LEFT JOIN especialidades esp ON e.idEspecialidad = esp.idEspecialidad
      LEFT JOIN grupos g ON r.idGrupo = g.idGrupo
      LEFT JOIN docentes d ON r.idDocente = d.idDocente
      LEFT JOIN usuarios ud ON d.idUsuario = ud.idUsuario
      ${where}
      ORDER BY r.fechaReporte DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Obtener total de reportes
    const [total] = await pool.query(
      `SELECT COUNT(*) as total FROM reportes r ${where}`,
      params
    );

    res.status(StatusCodes.OK).json({
      success: true,
      count: reportes.length,
      total: total[0].total,
      data: reportes,
    });
  } catch (error) {
    logger.error(`Error al obtener reportes: ${error.message}`);
    next(error);
  }
};

// @desc    Obtener un reporte por ID
// @route   GET /api/v1/reportes/:id
// @access  Private
exports.getReporte = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [reporte] = await pool.query(
      `SELECT 
        r.*,
        e.idEstudiante,
        e.numeroControl as matriculaEstudiante,
        CONCAT(ue.nombre, ' ', ue.apellidoPaterno, ' ', COALESCE(ue.apellidoMaterno, '')) as nombreEstudiante,
        ue.email as emailEstudiante,
        e.telefono as telefonoEstudiante,
        esp.nombre as especialidadEstudiante,
        esp.codigo as codigoEspecialidad,
        g.codigo as grupoEstudiante,
        g.semestre as semestreGrupo,
        d.idDocente,
        CONCAT(ud.nombre, ' ', ud.apellidoPaterno, ' ', COALESCE(ud.apellidoMaterno, '')) as nombreDocente,
        ud.email as emailDocente
      FROM reportes r
      LEFT JOIN estudiantes e ON r.idEstudiante = e.idEstudiante
      LEFT JOIN usuarios ue ON e.idUsuario = ue.idUsuario
      LEFT JOIN especialidades esp ON e.idEspecialidad = esp.idEspecialidad
      LEFT JOIN grupos g ON r.idGrupo = g.idGrupo
      LEFT JOIN docentes d ON r.idDocente = d.idDocente
      LEFT JOIN usuarios ud ON d.idUsuario = ud.idUsuario
      WHERE r.idReporte = ?`,
      [id]
    );

    if (reporte.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Reporte no encontrado',
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: reporte[0],
    });
  } catch (error) {
    logger.error(`Error al obtener reporte: ${error.message}`);
    next(error);
  }
};

// @desc    Crear un nuevo reporte
// @route   POST /api/v1/reportes
// @access  Private
exports.createReporte = async (req, res, next) => {
  try {
    const {
      idEstudiante,
      idGrupo,
      idDocente,
      tipo,
      titulo,
      descripcion,
      gravedad,
      accionTomada,
      fechaReporte,
      lugarEncontraba,
      leClasesReportado,
      nombreFirmaAlumno,
      nombreFirmaMaestro,
      nombreTutor,
      nombrePapaMamaTutor,
      telefono,
    } = req.body;

    // Validar campos requeridos
    if (!idEstudiante || !tipo || !titulo || !descripcion) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Faltan campos requeridos',
      });
    }

    // Crear el reporte
    const fechaReporteFormat = fechaReporte ? new Date(fechaReporte).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    const [result] = await pool.query(
      `INSERT INTO reportes (
        idEstudiante, idGrupo, tipo, titulo, descripcion,
        gravedad, estatus, accionTomada, fechaReporte, fechaCreacion, fechaRevision,
        lugarEncontraba, leClasesReportado, nombreFirmaAlumno, nombreFirmaMaestro,
        nombreTutor, nombrePapaMamaTutor, telefono
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, NOW(), NULL, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idEstudiante,
        idGrupo || null,
        tipo,
        titulo,
        descripcion,
        gravedad || 'media',
        accionTomada || null,
        fechaReporteFormat,
        lugarEncontraba || null,
        leClasesReportado || null,
        nombreFirmaAlumno || null,
        nombreFirmaMaestro || null,
        nombreTutor || null,
        nombrePapaMamaTutor || null,
        telefono || null,
      ]
    );

    // Obtener el reporte creado
    const [nuevoReporte] = await pool.query(
      `SELECT 
        r.*,
        CONCAT(ue.nombre, ' ', ue.apellidoPaterno, ' ', COALESCE(ue.apellidoMaterno, '')) as nombreEstudiante,
        e.numeroControl as matriculaEstudiante,
        esp.nombre as especialidadEstudiante,
        COALESCE(g.codigo, 'Sin grupo') as grupoEstudiante
      FROM reportes r
      INNER JOIN estudiantes e ON r.idEstudiante = e.idEstudiante
      INNER JOIN usuarios ue ON e.idUsuario = ue.idUsuario
      INNER JOIN especialidades esp ON e.idEspecialidad = esp.idEspecialidad
      LEFT JOIN grupos g ON r.idGrupo = g.idGrupo
      WHERE r.idReporte = ?`,
      [result.insertId]
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Reporte creado exitosamente',
      data: nuevoReporte[0],
    });
  } catch (error) {
    logger.error(`Error al crear reporte: ${error.message}`);
    next(error);
  }
};

// @desc    Actualizar un reporte
// @route   PUT /api/v1/reportes/:id
// @access  Private
exports.updateReporte = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      tipo,
      titulo,
      descripcion,
      gravedad,
      estatus,
      accionTomada,
      fechaReporte,
    } = req.body;

    // Verificar que el reporte existe
    const [existing] = await pool.query(
      'SELECT idReporte FROM reportes WHERE idReporte = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Reporte no encontrado',
      });
    }

    // Actualizar el reporte
    // Si se actualiza el estatus a 2 (revisado), establecer fechaRevision a NOW()
    await pool.query(
      `UPDATE reportes SET 
        tipo = COALESCE(?, tipo),
        titulo = COALESCE(?, titulo),
        descripcion = COALESCE(?, descripcion),
        gravedad = COALESCE(?, gravedad),
        estatus = COALESCE(?, estatus),
        accionTomada = COALESCE(?, accionTomada),
        fechaReporte = COALESCE(?, fechaReporte),
        fechaRevision = CASE WHEN ? = 2 THEN NOW() ELSE fechaRevision END
      WHERE idReporte = ?`,
      [tipo, titulo, descripcion, gravedad, estatus, accionTomada, fechaReporte, estatus, id]
    );

    // Obtener el reporte actualizado
    const [updated] = await pool.query(
      `SELECT 
        r.*,
        CONCAT(ue.nombre, ' ', ue.apellidoPaterno, ' ', COALESCE(ue.apellidoMaterno, '')) as nombreEstudiante,
        e.numeroControl as matriculaEstudiante,
        esp.nombre as especialidadEstudiante,
        g.codigo as grupoEstudiante
      FROM reportes r
      LEFT JOIN estudiantes e ON r.idEstudiante = e.idEstudiante
      LEFT JOIN usuarios ue ON e.idUsuario = ue.idUsuario
      LEFT JOIN especialidades esp ON e.idEspecialidad = esp.idEspecialidad
      LEFT JOIN grupos g ON r.idGrupo = g.idGrupo
      WHERE r.idReporte = ?`,
      [id]
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: updated[0],
    });
  } catch (error) {
    logger.error(`Error al actualizar reporte: ${error.message}`);
    next(error);
  }
};

// @desc    Eliminar un reporte
// @route   DELETE /api/v1/reportes/:id
// @access  Private
exports.deleteReporte = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el reporte existe
    const [existing] = await pool.query(
      'SELECT idReporte FROM reportes WHERE idReporte = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Reporte no encontrado',
      });
    }

    // Eliminar el reporte
    await pool.query('DELETE FROM reportes WHERE idReporte = ?', [id]);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Reporte eliminado correctamente',
    });
  } catch (error) {
    logger.error(`Error al eliminar reporte: ${error.message}`);
    next(error);
  }
};
