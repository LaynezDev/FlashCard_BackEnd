const db = require('../config/db');
const logger = require('../config/logger');

/**
 * Crea un nuevo Deck y opcionalmente lo vincula a un curso.
 * @param {object} deckData - Datos del deck (nombre_deck, descripcion, id_creador, id_curso, publico)
 * @returns {object} Deck creado con su ID
 */
exports.createDeck = async (deckData) => {
    const { nombre_deck, descripcion, id_creador, id_curso, publico } = deckData;
    
    // Insertar el Deck
    const deckQuery = 'INSERT INTO Decks (nombre_deck, descripcion, id_creador, publico) VALUES (?, ?, ?, ?)';
    const [deckResult] = await db.query(deckQuery, [nombre_deck, descripcion, id_creador, publico || false]);
    const id_deck = deckResult.insertId;

    // Asignar el Deck al Curso (si se proporciona)
    if (id_curso) {
        const courseQuery = 'INSERT INTO DeckCursos (id_deck, id_curso) VALUES (?, ?)';
        await db.query(courseQuery, [id_deck, id_curso]);
    }

    return { id_deck, ...deckData };
};

/**
 * Obtiene todos los Decks visibles para un usuario (creados, públicos o asignados a su curso).
 * @param {number} userId - ID del usuario que consulta
 * @param {number|null} userCourseId - ID del curso del usuario (null si no tiene curso)
 * @returns {Array} Lista de decks con id_deck, nombre_deck y descripcion
 */
exports.getAvailableDecks = async (userId, userCourseId) => {
    const query = `
        SELECT DISTINCT D.id_deck, D.nombre_deck, D.descripcion
        FROM Decks D
        LEFT JOIN DeckCursos DC ON D.id_deck = DC.id_deck
        WHERE 
            D.id_creador = ?       /* Decks creados por el usuario */
            OR D.publico = TRUE    /* Decks marcados como públicos */
            OR DC.id_curso = ?     /* Decks asignados al curso del usuario */
        ORDER BY D.nombre_deck
    `;
    const [rows] = await db.query(query, [userId, userCourseId]);
    return rows;
};

/**
 * Crea una nueva Flashcard dentro de un Deck.
 * @param {object} cardData - Datos de la flashcard (id_deck, pregunta, respuesta, imagen_url, tipo)
 * @returns {object} Flashcard creada con su ID
 */
exports.createFlashcard = async (cardData) => {
    const { id_deck, pregunta, respuesta, imagen_url, tipo } = cardData;
    const query = 'INSERT INTO Flashcards (id_deck, pregunta, respuesta, imagen_url,tipo) VALUES (?, ?, ?, ?,?)';
    const [result] = await db.query(query, [id_deck, pregunta, respuesta, imagen_url || null, tipo || 'texto']);
    return { id_flashcard: result.insertId, ...cardData };
};

/**
 * Obtiene todas las Flashcards de un Deck (campos selectos).
 * @param {number} id_deck - ID del deck
 * @returns {Array} Lista de flashcards ordenadas por ID
 */
exports.getFlashcardsByDeck = async (id_deck) => {
    const query = 'SELECT id_flashcard, pregunta, respuesta, imagen_url, tipo FROM Flashcards WHERE id_deck = ? ORDER BY id_flashcard';
    const [rows] = await db.query(query, [id_deck]);
    return rows;
};

/**
 * Obtiene todas las flashcards de un deck (todos los campos, orden descendente).
 * @param {number} deckId - ID del deck
 * @returns {Array} Lista completa de flashcards
 */
exports.getAllCardsInDeck = async (deckId) => {
    const query = 'SELECT * FROM Flashcards WHERE id_deck = ? ORDER BY id_flashcard DESC';
    const [rows] = await db.query(query, [deckId]);
    return rows;
};

/**
 * Elimina una flashcard específica por su ID.
 * @param {number} cardId - ID de la flashcard a eliminar
 */
exports.deleteFlashcard = async (cardId) => {
    const query = 'DELETE FROM Flashcards WHERE id_flashcard = ?';
    await db.query(query, [cardId]);
};

/**
 * Elimina un deck y todos sus registros asociados (flashcards, vinculaciones en DeckCursos).
 * @param {number} deckId - ID del deck a eliminar
 */
exports.deleteDeck = async (deckId) => {
    await db.query('DELETE FROM Flashcards WHERE id_deck = ?', [deckId]);
    await db.query('DELETE FROM DeckCursos WHERE id_deck = ?', [deckId]);
    await db.query('DELETE FROM Decks WHERE id_deck = ?', [deckId]);
};