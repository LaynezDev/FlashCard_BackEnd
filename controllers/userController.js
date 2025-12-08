const db = require('../config/db');
const bcrypt = require('bcrypt');

// Listar alumnos del mismo centro del profesor
exports.getStudentsByCenter = async (req, res) => {
    const centerId = req.user.id_centro; // Viene del Token JWT
    // Asumimos que tipo_usuario 'student' es el rol de alumno
    const query = 'SELECT id_usuario, nombre, email FROM Usuarios WHERE id_centro = ? AND tipo_usuario = "Alumno"';
    
    try {
        const [users] = await db.query(query, [centerId]);
        res.json(users);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener alumnos' });
    }
};

// Crear un alumno manualmente (El profesor le asigna email y password)
exports.createStudent = async (req, res) => {
    const { nombre, email, password } = req.body;
    const centerId = req.user.id_centro; // Se asigna automáticamente al centro del profesor
    console.log(req.body);
    console.log(req.user);
    if (!nombre || !email || !password) {
        return res.status(400).json({ msg: 'Faltan datos' });
    }

    try {
        // 1. Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 2. Insertar
        const query = 'INSERT INTO Usuarios (nombre, email, password_hash, tipo_usuario, id_centro) VALUES (?, ?, ?, "Alumno", ?)';
        await db.query(query, [nombre, email, password_hash, centerId]);

        res.status(201).json({ msg: 'Alumno creado exitosamente' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: 'El email ya está registrado.' });
        }
        res.status(500).json({ msg: 'Error al crear alumno' });
    }
};