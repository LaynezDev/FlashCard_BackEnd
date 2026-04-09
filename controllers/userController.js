const db = require("../config/db");
const bcrypt = require("bcrypt");

// Listar alumnos del mismo centro del profesor
exports.getStudentsByCenter = async (req, res) => {
    const centerId = req.user.id_centro; // Viene del Token JWT
    // Asumimos que tipo_usuario 'student' es el rol de alumno
    const query = 'SELECT id_usuario, nombre, email FROM Usuarios WHERE id_centro = ? AND tipo_usuario = "Alumno"';

    try {
        const [users] = await db.query(query, [centerId]);
        res.json(users);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener alumnos" });
    }
};

// Crear un alumno manualmente (El profesor le asigna email y password)
exports.createStudent = async (req, res) => {
    const { nombre, email, password } = req.body;
    const centerId = req.user.id_centro; // Se asigna automáticamente al centro del profesor
    console.log(req.body);
    console.log(req.user);
    if (!nombre || !email || !password) {
        return res.status(400).json({ msg: "Faltan datos" });
    }

    try {
        // 1. Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 2. Insertar
        const query = 'INSERT INTO Usuarios (nombre, email, password_hash, tipo_usuario, id_centro) VALUES (?, ?, ?, "Alumno", ?)';
        await db.query(query, [nombre, email, password_hash, centerId]);

        res.status(201).json({ msg: "Alumno creado exitosamente" });
    } catch (error) {
        console.error(error);
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ msg: "El email ya está registrado." });
        }
        res.status(500).json({ msg: "Error al crear alumno" });
    }
};

// ... imports

// Listar PROFESORES del mismo centro (Solo para Admin)
exports.getTeachersByCenter = async (req, res) => {
    const centerId = req.user.id_centro;

    // Verificación de seguridad básica
    if (req.user.tipo_usuario !== "Admin") {
        return res.status(403).json({ msg: "Acceso denegado" });
    }

    const query = 'SELECT id_usuario, nombre, email FROM Usuarios WHERE id_centro = ? AND tipo_usuario = "profesor"';

    try {
        const [users] = await db.query(query, [centerId]);
        res.json(users);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener profesores" });
    }
};

// Crear PROFESOR (Solo para Admin)
exports.createTeacher = async (req, res) => {
    // 1. Verificar que quien crea sea Admin
    console.log(req.user);
    if (req.user.tipo_usuario !== "Admin") {
        return res.status(403).json({ msg: "Solo el administrador puede registrar profesores." });
    }

    const { nombre, email, password } = req.body;
    const centerId = req.user.id_centro;

    if (!nombre || !email || !password) return res.status(400).json({ msg: "Faltan datos" });

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insertamos con rol 'profesor'
        const query = 'INSERT INTO Usuarios (nombre, email, password_hash, tipo_usuario, id_centro) VALUES (?, ?, ?, "profesor", ?)';
        await db.query(query, [nombre, email, password_hash, centerId]);

        res.status(201).json({ msg: "Profesor creado exitosamente" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") return res.status(400).json({ msg: "Email duplicado" });
        res.status(500).json({ msg: "Error al crear profesor" });
    }
};

// Actualizar contraseña de un alumno (solo para Admin/Profesor)
exports.updateStudentPassword = async (req, res) => {
    const { id } = req.params; // ID del alumno a actualizar
    const { password } = req.body; // Nueva contraseña
    const userId = req.user.id_usuario; // ID del usuario que realiza la acción (profesor/admin)
    const userType = req.user.tipo_usuario; // Tipo de usuario que realiza la acción
    const centerId = req.user.id_centro; // Centro del usuario que realiza la acción

    // 1. Validar permisos: Solo Admin o Profesor pueden cambiar la contraseña de un alumno
    if (userType !== "Admin" && userType !== "Profesor") {
        return res.status(403).json({ msg: "Acceso denegado. Solo administradores o profesores pueden cambiar contraseñas de alumnos." });
    }

    // 2. Validar datos de entrada
    if (!password || password.trim().length === 0) {
        return res.status(400).json({ msg: "La nueva contraseña no puede estar vacía." });
    }

    try {
        // Opcional: Verificar que el alumno pertenece al mismo centro
        const [studentRows] = await db.query('SELECT id_usuario, id_centro, tipo_usuario FROM Usuarios WHERE id_usuario = ?', [id]);
        if (studentRows.length === 0) {
            return res.status(404).json({ msg: "Alumno no encontrado." });
        }
        const student = studentRows[0];

        if (student.id_centro !== centerId || student.tipo_usuario !== "Alumno") {
            return res.status(403).json({ msg: "No tienes permiso para modificar la contraseña de este usuario o no es un alumno de tu centro." });
        }

        // 3. Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 4. Actualizar la contraseña en la base de datos
        const query = 'UPDATE Usuarios SET password_hash = ? WHERE id_usuario = ?';
        await db.query(query, [password_hash, id]);

        res.status(200).json({ msg: "Contraseña del alumno actualizada exitosamente." });
    } catch (error) {
        console.error("Error al actualizar la contraseña del alumno:", error);
        res.status(500).json({ msg: "Error interno del servidor al actualizar la contraseña." });
    }
};
