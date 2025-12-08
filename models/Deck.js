const db = require('../config/db');

// --- Funciones de Decks ---

/**
 * Crea un nuevo Deck.
 */
exports.createDeck = async (deckData) => {
    const { nombre_deck, descripcion, id_creador, id_curso, publico } = deckData;
    
    // Insertar el Deck
    const deckQuery = 'INSERT INTO Decks (nombre_deck, descripcion, id_creador, publico) VALUES (?, ?, ?, ?)';
    const [deckResult] = await db.query(deckQuery, [nombre_deck, descripcion, id_creador, publico || false]);
    console.log("Deck creado con ID:", deckResult.insertId);
    const id_deck = deckResult.insertId;

    // Asignar el Deck al Curso (si se proporciona)
    console.log("Vinculando deck al curso ID:", id_curso);
    console.log("Vinculando deck al id_deck:", id_deck);
    if (id_curso) {
        const courseQuery = 'INSERT INTO deckCursos (id_deck, id_curso) VALUES (?, ?)';
        await db.query(courseQuery, [id_deck, id_curso]);
    }

    return { id_deck, ...deckData };
};

/**
 * Obtiene todos los Decks visibles para un usuario (creados, públicos o asignados a su curso).
 */
exports.getAvailableDecks = async (userId, userCourseId) => {
    // Esta consulta es compleja ya que debe considerar múltiples criterios (creador, público, curso)
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

// --- Funciones de Flashcards ---

/**
 * Crea una nueva Flashcard dentro de un Deck.
 */
exports.createFlashcard = async (cardData) => {
    const { id_deck, pregunta, respuesta, imagen_url } = cardData;
    const query = 'INSERT INTO Flashcards (id_deck, pregunta, respuesta, imagen_url) VALUES (?, ?, ?, ?)';
    const [result] = await db.query(query, [id_deck, pregunta, respuesta, imagen_url || null]);
    return { id_flashcard: result.insertId, ...cardData };
};

/**
 * Obtiene todas las Flashcards de un Deck (usado para edición o listado).
 */
exports.getFlashcardsByDeck = async (id_deck) => {
    const query = 'SELECT id_flashcard, pregunta, respuesta, imagen_url FROM Flashcards WHERE id_deck = ? ORDER BY id_flashcard';
    const [rows] = await db.query(query, [id_deck]);
    return rows;
};

// Obtener TODAS las tarjetas de un deck (sin algoritmo, lista plana para editar)
exports.getAllCardsInDeck = async (deckId) => {
    const query = 'SELECT * FROM Flashcards WHERE id_deck = ? ORDER BY id_flashcard DESC';
    const [rows] = await db.query(query, [deckId]);
    return rows;
};

// Eliminar una tarjeta
exports.deleteFlashcard = async (cardId) => {
    const query = 'DELETE FROM Flashcards WHERE id_flashcard = ?';
    await db.query(query, [cardId]);
};

// Eliminar un deck completo (y sus tarjetas en cascada si la FK está configurada, si no, manual)
exports.deleteDeck = async (deckId) => {
    // Primero borramos las tarjetas asociadas para mantener integridad (si no hay CASCADE)
    await db.query('DELETE FROM Flashcards WHERE id_deck = ?', [deckId]);
    await db.query('DELETE FROM DeckCursos WHERE id_deck = ?', [deckId]);
    // Finalmente borramos el deck
    await db.query('DELETE FROM Decks WHERE id_deck = ?', [deckId]);
};