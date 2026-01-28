const mysql = require('mysql2/promise');
const { createPool } = require('mysql2/promise');
const logger = require('../utils/logger');

const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'control_academico',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info('Conexión exitosa a la base de datos MySQL');
    connection.release();
  } catch (error) {
    logger.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  }
};

// Ejecutar prueba de conexión al iniciar
testConnection();

module.exports = {
  pool,
  query: async (sql, params) => {
    try {
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (error) {
      logger.error('Error en la consulta SQL:', error);
      throw error;
    }
  },
  transaction: async (callback) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      await callback(connection);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};
