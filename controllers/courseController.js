const db = require('../config/db');
const logger = require('../config/logger');

/**
 * Obtiene los cursos del usuario actual según su rol.
 * Admin: ve todos los cursos de su centro con nombre del profesor.
 * Profesor: ve solo los cursos que él imparte.
 * Alumno: ve solo los cursos donde está inscrito.
 * @route GET /api/v1/courses
 * @returns {Array} Lista de cursos con información del profesor asignado
 */
exports.getMyCourses = async (req, res) => {
    const { id_usuario, tipo_usuario, id_centro } = req.user;

    let query = '';
    let params = [];

    if (tipo_usuario === 'Admin') {
        query = `
            SELECT C.*, U.nombre as nombre_profesor
            FROM Cursos C
            LEFT JOIN Usuarios U ON C.id_profesor = U.id_usuario
            WHERE C.id_centro = ?
        `;
        params = [id_centro];
    } else if (tipo_usuario === 'Profesor') {
        query = `
            SELECT * FROM Cursos
            WHERE id_profesor = ?
        `;
        params = [id_usuario];
    } else {
        query = `
            SELECT C.*, U.nombre as nombre_profesor
            FROM Cursos C
            INNER JOIN Inscripciones I ON C.id_curso = I.id_curso
            LEFT JOIN Usuarios U ON C.id_profesor = U.id_usuario
            WHERE I.id_usuario = ?
        `;
        params = [id_usuario];
    }

    try {
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        logger.error({ err: error.message }, 'Error al obtener cursos');
        res.status(500).json({ msg: 'Error al obtener cursos' });
    }
};

/**
 * Obtiene todos los decks asignados a un curso específico.
 * Realiza JOIN entre Decks y DeckCursos para filtrar por curso.
 * @route GET /api/v1/courses/:courseId/decks
 * @param {string} req.params.courseId - ID del curso
 * @returns {Array} Lista de decks asignados al curso
 */
exports.getDecksByCourse = async (req, res) => {
    const { courseId } = req.params;

    const query = `
        SELECT D.* FROM Decks D
        INNER JOIN DeckCursos DC ON D.id_deck = DC.id_deck
        WHERE DC.id_curso = ?
    `;

    try {
        const [rows] = await db.query(query, [courseId]);
        res.json(rows);
    } catch (error) {
        logger.error({ err: error.message }, 'Error al obtener decks del curso');
        res.status(500).json({ msg: 'Error al obtener decks del curso' });
    }
};

/**
 * Elimina un curso por su ID.
 * Solo Admin o Profesor pueden ejecutar esta acción.
 * @route DELETE /api/v1/courses/:courseId
 * @param {string} req.params.courseId - ID del curso a eliminar
 * @returns {object} { msg: 'Curso eliminado' }
 */
exports.deleteCourse = async (req, res) => {
    if (req.user.tipo_usuario !== 'Admin' && req.user.tipo_usuario !== 'Profesor') {
        return res.status(403).json({ msg: 'Acceso denegado.' });
    }
    const { courseId } = req.params;
    try {
        await db.query('DELETE FROM Cursos WHERE id_curso = ?', [courseId]);
        res.json({ msg: 'Curso eliminado' });
    } catch (error) {
        logger.error({ err: error.message }, 'Error al eliminar curso');
        res.status(500).json({ msg: 'Error al eliminar curso' });
    }
};

/**
 * Inscribe un alumno en un curso.
 * Solo Admin o Profesor pueden inscribir alumnos.
 * Verifica duplicados antes de insertar.
 * @route POST /api/v1/courses/enroll
 * @param {number} req.body.studentId - ID del alumno a inscribir
 * @param {number} req.body.courseId - ID del curso destino
 * @returns {object} { msg: 'Alumno inscrito correctamente' }
 */
exports.enrollStudent = async (req, res) => {
    if (req.user.tipo_usuario !== 'Admin' && req.user.tipo_usuario !== 'Profesor') {
        return res.status(403).json({ msg: 'No tienes permiso para inscribir alumnos.' });
    }

    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) {
        return res.status(400).json({ msg: 'Faltan datos (studentId o courseId)' });
    }

    const query = 'INSERT INTO Inscripciones (id_usuario, id_curso) VALUES (?, ?)';

    try {
        await db.query(query, [studentId, courseId]);
        res.json({ msg: 'Alumno inscrito correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: 'El alumno ya está inscrito en este curso.' });
        }
        logger.error({ err: error.message }, 'Error al inscribir alumno');
        res.status(500).json({ msg: 'Error al inscribir alumno' });
    }
};

/**
 * Crea un nuevo curso en el centro educativo del usuario.
 * Si el creador es Profesor, se auto-asigna como profesor del curso.
 * Si el creador es Admin, puede especificar id_profesor en el body.
 * @route POST /api/v1/courses
 * @param {string} req.body.nombre_curso - Nombre del curso (obligatorio)
 * @param {string} [req.body.descripcion] - Descripción del curso
 * @param {number} [req.body.id_profesor] - ID del profesor asignado (requerido si es Admin)
 * @returns {object} { msg: 'Curso creado y asignado exitosamente' }
 */
exports.createCourse = async (req, res) => {
    const { nombre_curso, descripcion, id_profesor } = req.body;
    const { id_centro, tipo_usuario, id_usuario } = req.user;

    let profesorAsignado = id_profesor;

    if (tipo_usuario === 'Profesor') {
        profesorAsignado = id_usuario;
    }

    const query = 'INSERT INTO Cursos (nombre_curso, descripcion, id_centro, id_profesor) VALUES (?, ?, ?, ?)';

    try {
        await db.query(query, [nombre_curso, descripcion, id_centro, profesorAsignado]);
        res.status(201).json({ msg: 'Curso creado y asignado exitosamente' });
    } catch (error) {
        logger.error({ err: error.message }, 'Error al crear curso');
        res.status(500).json({ msg: 'Error al crear curso' });
    }
};
