const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'mysql.railway.internal',
  user: 'root',          // tu usuario de MySQL
  password: 'YrxRWQwiUiknAxBwmLCxuXLHjrpMPDdd',          // tu contraseña
  database: 'railway'
});

db.connect((err) => {
  if (err) {
    console.error(' Error al conectar a MySQL:', err);
  } else {
    console.log(' Conexión exitosa a la base de datos control_academico');
  }
});

module.exports = db;
