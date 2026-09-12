const db = require("../config/db");
const bcrypt = require("bcrypt");
const logger = require("../config/logger");

/**
 * Lista todos los alumnos del mismo centro educativo que el profesor/admin.
 * Filtra por tipo_usuario = 'Alumno' y el centro del token JWT.
 * @route GET /api/v1/users/students
 * @returns {Array} Lista de alumnos con id_usuario, nombre y email
 */
exports.getStudentsByCenter = async (req, res) => {
    const centerId = req.user.id_centro;
    const query = 'SELECT id_usuario, nombre, email FROM Usuarios WHERE id_centro = ? AND tipo_usuario = "Alumno"';

    try {
        const [users] = await db.query(query, [centerId]);
        res.json(users);
    } catch (error) {
        logger.error({ err: error.message }, 'Error al obtener alumnos');
        res.status(500).json({ msg: "Error al obtener alumnos" });
    }
};

/**
 * Crea un nuevo alumno manualmente (asignado por profesor o admin).
 * Hashea la contraseña con bcrypt y lo asigna al centro del usuario autenticado.
 * @route POST /api/v1/users/students
 * @param {string} req.body.nombre - Nombre del alumno
 * @param {string} req.body.email - Email único del alumno
 * @param {string} req.body.password - Contraseña (mínimo 6 caracteres)
 * @returns {object} { msg: 'Alumno creado exitosamente' }
 */
exports.createStudent = async (req, res) => {
    const { nombre, email, password } = req.body;
    const centerId = req.user.id_centro;
    if (!nombre || !email || !password) {
        return res.status(400).json({ msg: "Faltan datos" });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const query = 'INSERT INTO Usuarios (nombre, email, password_hash, tipo_usuario, id_centro) VALUES (?, ?, ?, "Alumno", ?)';
        await db.query(query, [nombre, email, password_hash, centerId]);

        res.status(201).json({ msg: "Alumno creado exitosamente" });
    } catch (error) {
        logger.error({ err: error.message }, 'Error al crear alumno');
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ msg: "El email ya está registrado." });
        }
        res.status(500).json({ msg: "Error al crear alumno" });
    }
};

/**
 * Lista todos los profesores del mismo centro educativo.
 * Solo accesible para usuarios con rol Admin.
 * @route GET /api/v1/users/teachers
 * @returns {Array} Lista de profesores con id_usuario, nombre y email
 */
exports.getTeachersByCenter = async (req, res) => {
    const centerId = req.user.id_centro;

    if (req.user.tipo_usuario !== "Admin") {
        return res.status(403).json({ msg: "Acceso denegado" });
    }

    const query = 'SELECT id_usuario, nombre, email FROM Usuarios WHERE id_centro = ? AND tipo_usuario = "profesor"';

    try {
        const [users] = await db.query(query, [centerId]);
        res.json(users);
    } catch (error) {
        logger.error({ err: error.message }, 'Error al obtener profesores');
        res.status(500).json({ msg: "Error al obtener profesores" });
    }
};

/**
 * Crea un nuevo profesor en el centro educativo.
 * Solo accesible para usuarios con rol Admin.
 * Hashea la contraseña con bcrypt y asigna tipo_usuario = 'profesor'.
 * @route POST /api/v1/users/teachers
 * @param {string} req.body.nombre - Nombre del profesor
 * @param {string} req.body.email - Email único del profesor
 * @param {string} req.body.password - Contraseña (mínimo 6 caracteres)
 * @returns {object} { msg: 'Profesor creado exitosamente' }
 */
exports.createTeacher = async (req, res) => {
    if (req.user.tipo_usuario !== "Admin") {
        return res.status(403).json({ msg: "Solo el administrador puede registrar profesores." });
    }

    const { nombre, email, password } = req.body;
    const centerId = req.user.id_centro;

    if (!nombre || !email || !password) return res.status(400).json({ msg: "Faltan datos" });

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const query = 'INSERT INTO Usuarios (nombre, email, password_hash, tipo_usuario, id_centro) VALUES (?, ?, ?, "profesor", ?)';
        await db.query(query, [nombre, email, password_hash, centerId]);

        res.status(201).json({ msg: "Profesor creado exitosamente" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") return res.status(400).json({ msg: "Email duplicado" });
        logger.error({ err: error.message }, 'Error al crear profesor');
        res.status(500).json({ msg: "Error al crear profesor" });
    }
};

/**
 * Actualiza la contraseña de un alumno específico.
 * Solo Admin o Profesor pueden ejecutar esta acción.
 * Verifica que el alumno pertenezca al mismo centro antes de modificar.
 * @route PUT /api/v1/users/students/:id/password
 * @param {string} req.params.id - ID del alumno cuya contraseña se actualizará
 * @param {string} req.body.password - Nueva contraseña (mínimo 6 caracteres)
 * @returns {object} { msg: 'Contraseña del alumno actualizada exitosamente.' }
 */
exports.updateStudentPassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    const userId = req.user.id_usuario;
    const userType = req.user.tipo_usuario;
    const centerId = req.user.id_centro;

    if (userType !== "Admin" && userType !== "Profesor") {
        return res.status(403).json({ msg: "Acceso denegado. Solo administradores o profesores pueden cambiar contraseñas de alumnos." });
    }

    if (!password || password.trim().length === 0) {
        return res.status(400).json({ msg: "La nueva contraseña no puede estar vacía." });
    }

    try {
        const [studentRows] = await db.query('SELECT id_usuario, id_centro, tipo_usuario FROM Usuarios WHERE id_usuario = ?', [id]);
        if (studentRows.length === 0) {
            return res.status(404).json({ msg: "Alumno no encontrado." });
        }
        const student = studentRows[0];

        if (student.id_centro !== centerId || student.tipo_usuario !== "Alumno") {
            return res.status(403).json({ msg: "No tienes permiso para modificar la contraseña de este usuario o no es un alumno de tu centro." });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const query = 'UPDATE Usuarios SET password_hash = ? WHERE id_usuario = ?';
        await db.query(query, [password_hash, id]);

        res.status(200).json({ msg: "Contraseña del alumno actualizada exitosamente." });
    } catch (error) {
        logger.error({ err: error.message }, 'Error al actualizar la contraseña del alumno');
        res.status(500).json({ msg: "Error interno del servidor al actualizar la contraseña." });
    }
};
