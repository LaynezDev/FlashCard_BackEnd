const db = require('../config/db');
const logger = require('../config/logger');

/**
 * Obtiene el lote de flashcards para estudiar basado en el progreso del usuario.
 * Ordena por: tarjetas nuevas primero, luego las que necesitan revisión,
 * y finalmente por nivel de dominio (las menos dominadas primero).
 * @route GET /api/v1/progress/decks/:deckId/study
 * @param {string} req.params.deckId - ID del deck a estudiar
 * @returns {Array} Lista de flashcards con nivel_dominio y ultima_revision del usuario
 */
exports.getFlashcardsForStudy = async (req, res) => {
    const userId = req.user.id_usuario;
    const { deckId } = req.params;

    const query = `
        SELECT
            F.id_flashcard, F.pregunta, F.respuesta, P.nivel_dominio, P.ultima_revision
        FROM Flashcards F
        LEFT JOIN ProgresoUsuario P
            ON F.id_flashcard = P.id_flashcard AND P.id_usuario = ?
        WHERE F.id_deck = ?
        ORDER BY
            CASE WHEN P.id_progreso IS NULL THEN 0 ELSE 1 END ASC,
            CASE WHEN P.ultima_revision <= NOW() THEN 0 ELSE 1 END ASC,
            P.nivel_dominio ASC,
            RAND();
    `;

    try {
        const [results] = await db.query(query, [userId, deckId]);
        res.json(results);
    } catch (error) {
        logger.error({ err: error.message }, 'Error al obtener tarjetas para estudio');
        res.status(500).json({ msg: 'Error interno del servidor al cargar las tarjetas.' });
    }
};

/**
 * Calcula el intervalo de días para la próxima revisión (algoritmo SM2 simplificado).
 * @param {number} confianza - Nivel de dominio del 1 al 5
 * @returns {number} Días hasta la próxima revisión
 *   1 = 0.1 días (~2 horas), 2 = 1 día, 3 = 3 días, 4 = 7 días, 5 = 30 días
 */
function calculateInterval(confianza) {
    switch (confianza) {
        case 1: return 0.1;
        case 2: return 1;
        case 3: return 3;
        case 4: return 7;
        case 5: return 30;
        default: return 0;
    }
}

/**
 * Registra el resultado de una revisión de flashcard.
 * Si el usuario ya revisó esa tarjeta, actualiza el nivel y contador.
 * Si es nueva, crea un registro de progreso.
 * @route POST /api/v1/progress/flashcards/:cardId/review
 * @param {string} req.params.cardId - ID de la flashcard (para referencia)
 * @param {number} req.body.id_flashcard - ID de la flashcard a calificar
 * @param {number} req.body.nivel_dominio - Nivel de confianza (1-5, obligatorio)
 * @returns {object} { msg, next_review_in_days } con los días para la próxima revisión
 */
exports.registerReview = async (req, res) => {
    const userId = req.user.id_usuario;
    const { cardId } = req.params;
    const { id_flashcard, nivel_dominio } = req.body;

    if (nivel_dominio < 1 || nivel_dominio > 5) {
        return res.status(400).json({ msg: 'La confianza debe ser un valor entre 1 y 5.' });
    }

    const intervalDays = calculateInterval(nivel_dominio);

    const query = `
        INSERT INTO ProgresoUsuario (id_usuario, id_flashcard, nivel_dominio, ultima_revision, contador_revisiones)
        VALUES (?, ?, ?, NOW(), 1)
        ON DUPLICATE KEY UPDATE
            nivel_dominio = VALUES(nivel_dominio),
            ultima_revision = NOW(),
            contador_revisiones = contador_revisiones + 1;
    `;

    try {
        await db.query(query, [userId, id_flashcard, nivel_dominio, intervalDays, intervalDays]);
        res.status(200).json({ msg: 'Progreso actualizado exitosamente.', next_review_in_days: intervalDays });
    } catch (error) {
        logger.error({ err: error.message }, 'Error al registrar la revisión');
        res.status(500).json({ msg: 'Error interno del servidor al actualizar el progreso.' });
    }
};

/**
 * Obtiene las estadísticas de progreso de un deck para el usuario actual.
 * Calcula el porcentaje de dominio basado en la fórmula: puntos actuales / puntos máximos (5 por carta).
 * @route GET /api/v1/progress/:deckId/stats
 * @param {string} req.params.deckId - ID del deck
 * @returns {object} { percentage: number, total_cards: number } porcentaje de dominio y total de tarjetas
 */
exports.getDeckStats = async (req, res) => {
    const { deckId } = req.params;
    const userId = req.user.id_usuario;

    const query = `
        SELECT
            COUNT(F.id_flashcard) as total_cards,
            SUM(COALESCE(P.nivel_dominio, 0)) as total_points
        FROM Flashcards F
        LEFT JOIN ProgresoUsuario P
            ON F.id_flashcard = P.id_flashcard AND P.id_usuario = ?
        WHERE F.id_deck = ?
    `;

    try {
        const [rows] = await db.query(query, [userId, deckId]);
        const stats = rows[0];

        if (stats.total_cards === 0) {
            return res.json({ percentage: 0, total_cards: 0, mastered_cards: 0 });
        }

        const maxPoints = stats.total_cards * 5;
        const percentage = Math.round((stats.total_points / maxPoints) * 100);

        res.json({
            percentage,
            total_cards: stats.total_cards
        });

    } catch (error) {
        logger.error({ err: error.message }, 'Error al calcular estadísticas');
        res.status(500).json({ msg: 'Error al calcular estadísticas' });
    }
};

/**
 * Genera un reporte de progreso de todos los alumnos de un curso para un deck específico.
 * Calcula el porcentaje de dominio de cada alumno y lo ordena de mayor a menor.
 * Solo accesible para profesores/admin.
 * @route GET /api/v1/progress/report/:courseId/:deckId
 * @param {string} req.params.courseId - ID del curso
 * @param {string} req.params.deckId - ID del deck
 * @returns {object} { deck_info: { total_cards }, students: [{ id, name, email, percentage, raw_score }] }
 */
exports.getTeacherReport = async (req, res) => {
    if (req.user.tipo_usuario !== 'Profesor' && req.user.tipo_usuario !== 'Admin') {
        return res.status(403).json({ msg: 'Acceso denegado. Solo profesores y administradores pueden ver reportes.' });
    }

    const { courseId, deckId } = req.params;

    const deckQuery = 'SELECT COUNT(*) as total_cards FROM Flashcards WHERE id_deck = ?';

    const reportQuery = `
        SELECT
            U.id_usuario,
            U.nombre,
            U.email,
            SUM(COALESCE(P.nivel_dominio, 0)) as total_points_user
        FROM Inscripciones I
        JOIN Usuarios U ON I.id_usuario = U.id_usuario
        LEFT JOIN Flashcards F ON F.id_deck = ?
        LEFT JOIN ProgresoUsuario P ON P.id_flashcard = F.id_flashcard AND P.id_usuario = U.id_usuario
        WHERE I.id_curso = ? AND U.tipo_usuario = 'Alumno'
        GROUP BY U.id_usuario, U.nombre, U.email
        ORDER BY total_points_user DESC
    `;

    try {
        const [deckRows] = await db.query(deckQuery, [deckId]);
        const totalCards = deckRows[0].total_cards;
        const maxPossiblePoints = totalCards * 5;

        const [studentsRows] = await db.query(reportQuery, [deckId, courseId]);

        const report = studentsRows.map(student => {
            let percentage = 0;
            if (maxPossiblePoints > 0) {
                percentage = Math.round((student.total_points_user / maxPossiblePoints) * 100);
            }
            return {
                id: student.id_usuario,
                name: student.nombre,
                email: student.email,
                percentage: percentage > 100 ? 100 : percentage,
                raw_score: student.total_points_user
            };
        });

        res.json({
            deck_info: { total_cards: totalCards },
            students: report
        });

    } catch (error) {
        logger.error({ err: error.message }, 'Error generando reporte');
        res.status(500).json({ msg: 'Error generando reporte' });
    }
};
