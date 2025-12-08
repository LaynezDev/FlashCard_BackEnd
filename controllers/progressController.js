const db = require('../config/db'); // Asume que tienes un módulo de conexión a MySQL

/**
 * Obtiene el lote de flashcards a estudiar basado en el progreso del usuario.
 * @param {object} req - Objeto de solicitud (contiene req.user.id_usuario y req.params.deckId)
 * @param {object} res - Objeto de respuesta
 */
exports.getFlashcardsForStudy = async (req, res) => {
    const userId = req.user.id_usuario; // Obtenido del JWT
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
        // Ejecutar la consulta en MySQL
        const [results] = await db.query(query, [userId, deckId]);
        
        // El driver mysql2 devuelve un array de arrays (results y fields), por eso [results]
        res.json(results);
    } catch (error) {
        console.error('Error al obtener tarjetas para estudio:', error);
        res.status(500).json({ msg: 'Error interno del servidor al cargar las tarjetas.' });
    }
};

/**
 * Calcula el intervalo de días para la próxima revisión basado en la confianza (nivel SM2).
 * Podrías implementar una lógica más avanzada, pero esto es un buen punto de partida.
 * @param {number} confianza - Puntuación de 1 a 5.
 * @returns {number} - Número de días para el próximo estudio.
 */
function calculateInterval(confianza) {
    switch (confianza) {
        case 1: // Olvidado o muy baja confianza
            return 0.1; // 0.1 días (aproximadamente 2 horas o inmediato)
        case 2: // Necesita repetir pronto
            return 1; // 1 día
        case 3: // Lo sabía, pero necesita refuerzo
            return 3; // 3 días
        case 4: // Bastante seguro
            return 7; // 7 días
        case 5: // Dominado
            return 30; // 30 días
        default:
            return 0;
    }
}


exports.registerReview = async (req, res) => {
    const userId = req.user.id_usuario;
    const { cardId } = req.params;
    const { confianza } = req.body; // Un número del 1 al 5

    if (confianza < 1 || confianza > 5) {
        return res.status(400).json({ msg: 'La confianza debe ser un valor entre 1 y 5.' });
    }

    // 1. Calcular el intervalo de días
    const intervalDays = calculateInterval(confianza);
    
    // Usamos la función DATE_ADD de MySQL para la fecha, pero necesitamos el número de días
    const query = `
        INSERT INTO ProgresoUsuario (id_usuario, id_flashcard, nivel_dominio, ultima_revision, contador_revisiones)
        VALUES (?, ?, ?, NOW(),  1)
        ON DUPLICATE KEY UPDATE 
            nivel_dominio = VALUES(nivel_dominio),
            ultima_revision = NOW(),
            contador_revisiones = contador_revisiones + 1;
    `;

    try {
        await db.query(query, [userId, cardId, confianza, intervalDays, intervalDays]);
        res.status(200).json({ msg: 'Progreso actualizado exitosamente.', next_review_in_days: intervalDays });
    } catch (error) {
        console.error('Error al registrar la revisión:', error);
        res.status(500).json({ msg: 'Error interno del servidor al actualizar el progreso.' });
    }
};

// ... imports ...

// Obtener estadísticas de un Deck específico para el usuario actual
exports.getDeckStats = async (req, res) => {
    const { deckId } = req.params;
    const userId = req.user.id_usuario;

    // Esta consulta hace lo siguiente:
    // 1. Cuenta cuántas tarjetas hay en total.
    // 2. Suma el nivel de dominio (0-5) de las tarjetas que el usuario ha estudiado.
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

        // Fórmula Brainscape simplificada: Puntos actuales / Puntos máximos posibles (5 por carta)
        const maxPoints = stats.total_cards * 5;
        const percentage = Math.round((stats.total_points / maxPoints) * 100);

        res.json({
            percentage, // Ej: 45
            total_cards: stats.total_cards
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al calcular estadísticas' });
    }
};