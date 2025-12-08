const db = require('../config/db'); // Tu pool de conexiones de MySQL

/**
 * Encuentra un usuario por su dirección de email.
 * @param {string} email - El email del usuario.
 * @returns {object|null} - El objeto usuario o null si no se encuentra.
 */
exports.findByEmail = async (email) => {
    const query = 'SELECT id_usuario, nombre, email, password_hash, tipo_usuario, id_centro FROM Usuarios WHERE email = ?';
    
    try {
        const [rows] = await db.query(query, [email]);
        return rows.length > 0 ? rows[0] : null; 
    } catch (error) {
        console.error('Error al buscar usuario por email:', error);
        throw error;
    }
};

/**
 * Crea un nuevo usuario en la base de datos.
 * @param {object} userData - Datos del nuevo usuario (nombre, email, hash, tipo_usuario, id_centro).
 * @returns {object} - El objeto con el ID insertado.
 */
exports.create = async (userData) => {
    const { nombre, email, password_hash, tipo_usuario, id_centro } = userData;
    
    const query = `
        INSERT INTO Usuarios 
        (nombre, email, password_hash, tipo_usuario, id_centro)
        VALUES (?, ?, ?, ?, ?)
    `;
    
    try {
        const [result] = await db.query(query, [nombre, email, password_hash, tipo_usuario, id_centro]);
        
        // MySQL devuelve el ID de la fila insertada en insertId
        return { 
            id_usuario: result.insertId,
            ...userData // Devolver los datos para el JWT
        }; 
    } catch (error) {
        console.error('Error al crear el usuario en la DB:', error);
        throw error;
    }
};
// NOTA: La función para registrar nuevos usuarios (registerUser) iría aquí también.