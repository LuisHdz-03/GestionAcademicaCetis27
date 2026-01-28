const { StatusCodes } = require('http-status-codes');
const { pool } = require('../config/db.config');
const logger = require('../utils/logger');

// ===== MATERIAS =====

// GET /api/v1/academico/materias
exports.getMaterias = async (req, res, next) => {
  try {
    const { especialidad } = req.query;

    const params = [];
    let where = 'WHERE m.activo = true';
    if (especialidad) {
      where += ' AND (esp.codigo = ? OR esp.idEspecialidad = ?)';
      params.push(especialidad, Number.isNaN(Number(especialidad)) ? 0 : Number(especialidad));
    }

    const [rows] = await pool.query(
      `SELECT 
        m.idMateria as id,
        m.nombre,
        m.codigo,
        m.horas as totalHoras,
        m.semestre,
        m.idEspecialidad,
        esp.nombre as especialidadNombre,
        esp.codigo as especialidadCodigo,
        m.activo
      FROM materias m
      INNER JOIN especialidades esp ON m.idEspecialidad = esp.idEspecialidad
      ${where}
      ORDER BY m.semestre ASC, m.nombre ASC`,
      params
    );

    res.status(StatusCodes.OK).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    logger.error(`Error al obtener materias: ${error.message}`);
    next(error);
  }
};

// POST /api/v1/academico/materias
exports.createMateria = async (req, res, next) => {
  try {
    const { nombre, codigo, semestre, horas, idEspecialidad, activo } = req.body;

    if (!nombre || !codigo || !idEspecialidad || !semestre || !horas) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Faltan campos requeridos' });
    }

    const [existing] = await pool.query('SELECT idMateria FROM materias WHERE codigo = ? LIMIT 1', [codigo]);
    if (existing.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El código de materia ya existe' });
    }

    const [result] = await pool.query(
      `INSERT INTO materias (idEspecialidad, nombre, codigo, semestre, horas, activo)
       VALUES (?, ?, ?, ?, ?, COALESCE(?, true))`,
      [idEspecialidad, nombre, codigo, semestre, horas, activo]
    );

    const [created] = await pool.query(
      `SELECT idMateria as id, nombre, codigo, horas as totalHoras, semestre, idEspecialidad, activo
       FROM materias WHERE idMateria = ?`,
      [result.insertId]
    );

    res.status(StatusCodes.CREATED).json({ success: true, data: created[0] });
  } catch (error) {
    logger.error(`Error al crear materia: ${error.message}`);
    next(error);
  }
};

// PUT /api/v1/academico/materias/:id
exports.updateMateria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, semestre, horas, idEspecialidad, activo } = req.body;

    const [existing] = await pool.query('SELECT idMateria FROM materias WHERE idMateria = ?', [id]);
    if (!existing.length) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Materia no encontrada' });
    }

    if (codigo) {
      const [duplicate] = await pool.query('SELECT idMateria FROM materias WHERE codigo = ? AND idMateria != ?', [codigo, id]);
      if (duplicate.length > 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El código de materia ya existe' });
      }
    }

    await pool.query(
      `UPDATE materias SET 
        nombre = COALESCE(?, nombre),
        codigo = COALESCE(?, codigo),
        semestre = COALESCE(?, semestre),
        horas = COALESCE(?, horas),
        idEspecialidad = COALESCE(?, idEspecialidad),
        activo = COALESCE(?, activo)
      WHERE idMateria = ?`,
      [nombre, codigo, semestre, horas, idEspecialidad, activo, id]
    );

    return res.status(StatusCodes.OK).json({ success: true, message: 'Materia actualizada correctamente' });
  } catch (error) {
    logger.error(`Error al actualizar materia: ${error.message}`);
    next(error);
  }
};

// DELETE /api/v1/academico/materias/:id
exports.deleteMateria = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT idMateria FROM materias WHERE idMateria = ?', [id]);
    if (!existing.length) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Materia no encontrada' });
    }

    await pool.query('UPDATE materias SET activo = false WHERE idMateria = ?', [id]);

    return res.status(StatusCodes.OK).json({ success: true, message: 'Materia eliminada correctamente' });
  } catch (error) {
    logger.error(`Error al eliminar materia: ${error.message}`);
    next(error);
  }
};

// ===== GRUPOS =====

// GET /api/v1/academico/grupos
exports.getGrupos = async (req, res, next) => {
  try {
    const { especialidad } = req.query;

    const params = [];
    let where = 'WHERE g.activo = true';
    if (especialidad) {
      where += ' AND (esp.codigo = ? OR esp.idEspecialidad = ?)';
      params.push(especialidad, Number.isNaN(Number(especialidad)) ? 0 : Number(especialidad));
    }

    const [rows] = await pool.query(
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
        g.activo,
        COALESCE((SELECT COUNT(*) FROM inscripciones i WHERE i.idGrupo = g.idGrupo AND i.activo = 1), 0) as integrantes
      FROM grupos g
      INNER JOIN especialidades esp ON g.idEspecialidad = esp.idEspecialidad
      ${where}
      ORDER BY g.semestre ASC, g.codigo ASC`,
      params
    );

    res.status(StatusCodes.OK).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    logger.error(`Error al obtener grupos: ${error.message}`);
    next(error);
  }
};

// POST /api/v1/academico/grupos
exports.createGrupo = async (req, res, next) => {
  try {
    const { codigo, semestre, aula, idEspecialidad, idPeriodo, idDocente, idMateria, activo } = req.body;

    if (!codigo || !semestre || !idEspecialidad || !idPeriodo || !idDocente || !idMateria) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Faltan campos requeridos' });
    }

    const [existing] = await pool.query('SELECT idGrupo FROM grupos WHERE codigo = ? LIMIT 1', [codigo]);
    if (existing.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El código de grupo ya existe' });
    }

    const [result] = await pool.query(
      `INSERT INTO grupos (idPeriodo, idDocente, idMateria, idEspecialidad, codigo, semestre, aula, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, true))`,
      [idPeriodo, idDocente, idMateria, idEspecialidad, codigo, semestre, aula || null, activo]
    );

    const [created] = await pool.query(
      `SELECT idGrupo as id, codigo, semestre, aula, idEspecialidad, idPeriodo, idDocente, idMateria, activo
       FROM grupos WHERE idGrupo = ?`,
      [result.insertId]
    );

    res.status(StatusCodes.CREATED).json({ success: true, data: created[0] });
  } catch (error) {
    logger.error(`Error al crear grupo: ${error.message}`);
    next(error);
  }
};

// PUT /api/v1/academico/grupos/:id
exports.updateGrupo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { codigo, semestre, aula, idEspecialidad, idPeriodo, idDocente, idMateria, activo } = req.body;

    const [existing] = await pool.query('SELECT idGrupo FROM grupos WHERE idGrupo = ?', [id]);
    if (!existing.length) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Grupo no encontrado' });
    }

    if (codigo) {
      const [duplicate] = await pool.query('SELECT idGrupo FROM grupos WHERE codigo = ? AND idGrupo != ?', [codigo, id]);
      if (duplicate.length > 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El código de grupo ya existe' });
      }
    }

    await pool.query(
      `UPDATE grupos SET 
        codigo = COALESCE(?, codigo),
        semestre = COALESCE(?, semestre),
        aula = COALESCE(?, aula),
        idEspecialidad = COALESCE(?, idEspecialidad),
        idPeriodo = COALESCE(?, idPeriodo),
        idDocente = COALESCE(?, idDocente),
        idMateria = COALESCE(?, idMateria),
        activo = COALESCE(?, activo)
      WHERE idGrupo = ?`,
      [codigo, semestre, aula, idEspecialidad, idPeriodo, idDocente, idMateria, activo, id]
    );

    return res.status(StatusCodes.OK).json({ success: true, message: 'Grupo actualizado correctamente' });
  } catch (error) {
    logger.error(`Error al actualizar grupo: ${error.message}`);
    next(error);
  }
};

// DELETE /api/v1/academico/grupos/:id
exports.deleteGrupo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT idGrupo FROM grupos WHERE idGrupo = ?', [id]);
    if (!existing.length) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Grupo no encontrado' });
    }

    await pool.query('UPDATE grupos SET activo = false WHERE idGrupo = ?', [id]);

    return res.status(StatusCodes.OK).json({ success: true, message: 'Grupo eliminado correctamente' });
  } catch (error) {
    logger.error(`Error al eliminar grupo: ${error.message}`);
    next(error);
  }
};


