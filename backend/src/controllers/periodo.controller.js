const { StatusCodes } = require("http-status-codes");
const { pool } = require("../config/db.config");
const logger = require("../utils/logger");
const { validationResult } = require("express-validator");

exports.getPeriodoActivo = async (req, res, next) => {
  try {
    const [periodo] = await pool.query(
      "SELECT idPeriodo, nombre, fechaInicio, fechaFin, activo FROM periodos WHERE activo = true LIMIT 1",
    );

    if (periodo.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        data: null,
        message: "No hay un período activo actualmente",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: periodo[0],
    });
  } catch (error) {
    logger.error(`Error al obtener período activo: ${error.message}`);
    next(error);
  }
};

exports.crearPeriodo = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      errors: errors.array(),
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { nombre, fechaInicio, fechaFin } = req.body;

    const [periodoActivo] = await connection.query(
      "SELECT idPeriodo FROM periodos WHERE activo = true FOR UPDATE",
    );

    if (periodoActivo.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message:
          "Ya existe un período activo. Debe desactivarlo antes de crear uno nuevo.",
      });
    }

    // Verificar si ya existe un periodo con el mismo nombre
    const [existingPeriodo] = await connection.query(
      "SELECT idPeriodo FROM periodos WHERE nombre = ?",
      [nombre],
    );

    if (existingPeriodo.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Ya existe un período con ese nombre.",
      });
    }

    const [result] = await connection.query(
      "INSERT INTO periodos (nombre, fechaInicio, fechaFin, activo, fechaCreacion, fechaEdicion) VALUES (?, ?, ?, true, NOW(), NOW())",
      [nombre, fechaInicio, fechaFin],
    );

    await connection.commit();

    const [nuevoPeriodo] = await connection.query(
      "SELECT idPeriodo, nombre, fechaInicio, fechaFin, activo FROM periodos WHERE idPeriodo = ?",
      [result.insertId],
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: nuevoPeriodo[0],
    });
  } catch (error) {
    await connection.rollback();
    logger.error(`Error al crear período: ${error.message}`);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Ya existe un período con ese código",
      });
    }

    next(error);
  } finally {
    connection.release();
  }
};

exports.getPeriodos = async (req, res, next) => {
  try {
    const [periodos] = await pool.query(
      "SELECT idPeriodo, nombre, fechaInicio, fechaFin, activo, fechaCreacion FROM periodos ORDER BY fechaInicio DESC",
    );

    res.status(StatusCodes.OK).json({
      success: true,
      count: periodos.length,
      data: periodos,
    });
  } catch (error) {
    logger.error(`Error al obtener períodos: ${error.message}`);
    next(error);
  }
};

exports.actualizarPeriodo = async (req, res, next) => {
  const { id } = req.params;
  const { nombre, fechaInicio, fechaFin, activo } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [periodo] = await connection.query(
      "SELECT idPeriodo FROM periodos WHERE idPeriodo = ?",
      [id],
    );

    if (periodo.length === 0) {
      await connection.rollback();
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Período no encontrado",
      });
    }

    if (activo === true) {
      await connection.query(
        "UPDATE periodos SET activo = false WHERE idPeriodo != ?",
        [id],
      );
    }

    await connection.query(
      `UPDATE periodos SET 
        nombre = COALESCE(?, nombre),
        fechaInicio = COALESCE(?, fechaInicio),
        fechaFin = COALESCE(?, fechaFin),
        activo = COALESCE(?, activo)
      WHERE idPeriodo = ?`,
      [nombre, fechaInicio, fechaFin, activo, id],
    );

    await connection.commit();

    const [periodoActualizado] = await connection.query(
      "SELECT idPeriodo, nombre, fechaInicio, fechaFin, activo FROM periodos WHERE idPeriodo = ?",
      [id],
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: periodoActualizado[0],
    });
  } catch (error) {
    await connection.rollback();
    logger.error(`Error al actualizar período: ${error.message}`);
    next(error);
  } finally {
    connection.release();
  }
};

exports.eliminarPeriodo = async (req, res, next) => {
  const { id } = req.params;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [periodo] = await connection.query(
      "SELECT idPeriodo, activo FROM periodos WHERE idPeriodo = ?",
      [id],
    );

    if (periodo.length === 0) {
      await connection.rollback();
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Período no encontrado",
      });
    }

    if (periodo[0].activo) {
      await connection.rollback();
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "No se puede eliminar un período activo",
      });
    }

    await connection.query("DELETE FROM periodos WHERE idPeriodo = ?", [id]);

    await connection.commit();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Período eliminado correctamente",
    });
  } catch (error) {
    await connection.rollback();
    logger.error(`Error al eliminar período: ${error.message}`);

    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message:
          "No se puede eliminar el período porque tiene registros asociados",
      });
    }

    next(error);
  } finally {
    connection.release();
  }
};
