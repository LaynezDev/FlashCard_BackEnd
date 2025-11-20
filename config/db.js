const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear un pool de conexiones para manejar las consultas de manera eficiente
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Número máximo de conexiones
    queueLimit: 0
});

// Exportar el pool para ser usado en los controladores
module.exports = pool;