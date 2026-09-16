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

    let fromClause = '';
    let whereClause = '';
    let params = [];

    if (tipo_usuario === 'Admin') {
        fromClause = `FROM Cursos C LEFT JOIN Usuarios U ON C.id_profesor = U.id_usuario`;
        whereClause = `WHERE C.id_centro = ?`;
        params = [id_centro];
    } else if (tipo_usuario === 'Profesor') {
        fromClause = `FROM Cursos C LEFT JOIN Usuarios U ON C.id_profesor = U.id_usuario`;
        whereClause = `WHERE C.id_profesor = ?`;
        params = [id_usuario];
    } else {
        fromClause = `FROM Cursos C INNER JOIN Inscripciones I ON C.id_curso = I.id_curso LEFT JOIN Usuarios U ON C.id_profesor = U.id_usuario`;
        whereClause = `WHERE I.id_usuario = ?`;
        params = [id_usuario];
    }

    const statsSubquery = `
        SELECT 
            DC.id_curso,
            COUNT(DISTINCT DC.id_deck) AS total_decks,
            COUNT(DISTINCT F.id_flashcard) AS total_cards,
            SUM(CASE WHEN PU.nivel_dominio = 5 THEN 1 ELSE 0 END) + 0 AS cards_mastered_5,
            SUM(CASE WHEN ds.deck_pct >= 100 THEN 1 ELSE 0 END) + 0 AS decks_completed,
            MAX(PU.ultima_revision) AS last_interaction
        FROM DeckCursos DC
        LEFT JOIN Decks D ON DC.id_deck = D.id_deck
        LEFT JOIN Flashcards F ON D.id_deck = F.id_deck
        LEFT JOIN ProgresoUsuario PU ON F.id_flashcard = PU.id_flashcard
        LEFT JOIN (
            SELECT 
                F2.id_deck,
                CASE WHEN COUNT(F2.id_flashcard) > 0
                    THEN ROUND(SUM(COALESCE(PU2.nivel_dominio, 0)) / (COUNT(F2.id_flashcard) * 5) * 100)
                    ELSE 0
                END AS deck_pct
            FROM Flashcards F2
            LEFT JOIN ProgresoUsuario PU2 ON F2.id_flashcard = PU2.id_flashcard
            GROUP BY F2.id_deck
        ) ds ON D.id_deck = ds.id_deck
        GROUP BY DC.id_curso
    `;

    const query = `
        SELECT 
            C.*,
            U.nombre AS nombre_profesor,
            COALESCE(stats.total_decks, 0) AS total_decks,
            COALESCE(stats.total_cards, 0) AS total_cards,
            COALESCE(stats.cards_mastered_5, 0) AS cards_mastered_5,
            COALESCE(stats.decks_completed, 0) AS decks_completed,
            stats.last_interaction
        ${fromClause}
        LEFT JOIN (${statsSubquery}) stats ON C.id_curso = stats.id_curso
        ${whereClause}
    `;

    try {
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        logger.error({ err: error.message, stack: error.stack }, 'Error al obtener cursos');
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
