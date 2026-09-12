const Deck = require('../models/Deck');
const logger = require('../config/logger');

/**
 * Crea un nuevo deck de flashcards.
 * Asigna automáticamente el ID del creador desde el JWT.
 * Si se proporciona id_curso, vincula el deck a ese curso en DeckCursos.
 * @route POST /api/v1/decks
 * @param {string} req.body.nombre_deck - Nombre del deck (obligatorio)
 * @param {string} [req.body.descripcion] - Descripción opcional del deck
 * @param {number} [req.body.id_curso] - ID del curso al que se vincula (opcional)
 * @param {boolean} [req.body.publico] - Si es true, cualquier usuario puede verlo
 * @returns {object} Deck creado con todos sus campos
 */
exports.createDeck = async (req, res) => {
    const id_creador = req.user.id_usuario;
    const { nombre_deck, descripcion, id_curso, publico } = req.body;

    if (!nombre_deck) {
        return res.status(400).json({ msg: 'El nombre del Deck es obligatorio.' });
    }

    try {
        const newDeck = await Deck.createDeck({
            nombre_deck,
            descripcion,
            id_creador,
            id_curso,
            publico
        });
        res.status(201).json(newDeck);
    } catch (error) {
        logger.error({ err: error.message }, 'Error al crear el deck');
        res.status(500).json({ msg: 'Error interno del servidor al crear el deck.' });
    }
};

/**
 * Obtiene todos los decks disponibles para el usuario actual.
 * Incluye: decks creados por el usuario, decks públicos y decks asignados a su curso.
 * @route GET /api/v1/decks
 * @returns {Array} Lista de decks con id_deck, nombre_deck y descripcion
 */
exports.getDecks = async (req, res) => {
    const userId = req.user.id_usuario;
    const userCourseId = req.user.id_curso || null;

    try {
        const decks = await Deck.getAvailableDecks(userId, userCourseId);
        res.json(decks);
    } catch (error) {
        logger.error({ err: error.message }, 'Error al obtener los decks');
        res.status(500).json({ msg: 'Error interno del servidor al listar los decks.' });
    }
};

/**
 * Crea una nueva flashcard dentro de un deck.
 * Soporta subida de imagen opcional via multer.
 * @route POST /api/v1/decks/cards
 * @param {number} req.body.id_deck - ID del deck padre (obligatorio)
 * @param {string} req.body.pregunta - Texto de la pregunta (obligatorio)
 * @param {string} req.body.respuesta - Texto de la respuesta (obligatorio)
 * @param {string} [req.body.tipo] - Tipo: 'texto', 'imagen', 'narrado' o 'traduccion'
 * @param {File} [req.file] - Archivo de imagen (jpeg, jpg, png, gif, máx 5MB)
 * @returns {object} Flashcard creada con todos sus campos
 */
exports.createFlashcard = async (req, res) => {
    const { id_deck, pregunta, respuesta, tipo } = req.body;
    let imagen_url = null;
    if (req.file) {
        imagen_url = `/uploads/${req.file.filename}`;
    }

    if (!pregunta || !respuesta) {
        return res.status(400).json({ msg: 'Pregunta y respuesta son obligatorias.' });
    }
    try {
        const newCard = await Deck.createFlashcard({ id_deck: id_deck, pregunta, respuesta, imagen_url, tipo });
        res.status(201).json(newCard);
    } catch (error) {
        logger.error({ err: error.message }, 'Error al crear la flashcard');
        res.status(500).json({ msg: 'Error interno del servidor al crear la tarjeta.' });
    }
};

/**
 * Lista todas las flashcards de un deck específico.
 * Retorna preguntas, respuestas, imagen_url y tipo.
 * @route GET /api/v1/decks/:deckId/cards
 * @param {string} req.params.deckId - ID del deck
 * @returns {Array} Lista de flashcards ordenadas por ID
 */
exports.getFlashcards = async (req, res) => {
    const { deckId } = req.params;

    try {
        const cards = await Deck.getFlashcardsByDeck(deckId);
        res.json(cards);
    } catch (error) {
        logger.error({ err: error.message }, 'Error al obtener las flashcards');
        res.status(500).json({ msg: 'Error interno del servidor al listar las tarjetas.' });
    }
};

/**
 * Obtiene todas las flashcards de un deck (consulta directa a la DB).
 * Alternativa a getFlashcards que retorna todos los campos (*).
 * @route GET /api/v1/decks/:deckId/flashcards
 * @param {string} req.params.deckId - ID del deck
 * @returns {Array} Lista completa de flashcards ordenadas por ID descendente
 */
exports.getCardsByDeck = async (req, res) => {
    const { deckId } = req.params;
    try {
        const query = 'SELECT * FROM Flashcards WHERE id_deck = ?';
        const [rows] = await db.query(query, [deckId]);
        res.json(rows);
    } catch (error) {
        logger.error({ err: error.message }, 'Error al obtener tarjetas por deck');
        res.status(500).json({ msg: 'Error al obtener tarjetas' });
    }
};

/**
 * Obtiene los detalles completos de un deck para edición.
 * Retorna todas las flashcards del deck para ser editadas por el creador o admin.
 * @route GET /api/v1/decks/:deckId/editor
 * @param {string} req.params.deckId - ID del deck
 * @returns {object} { cards: Array } con la lista de flashcards
 */
exports.getDeckDetails = async (req, res) => {
    const { deckId } = req.params;
    try {
        const cards = await Deck.getAllCardsInDeck(deckId);
        res.json({ cards });
    } catch (error) {
        logger.error({ err: error.message }, 'Error al cargar tarjetas');
        res.status(500).json({ msg: 'Error al cargar tarjetas.' });
    }
};

/**
 * Elimina un deck y todas sus flashcards asociadas.
 * Las FK con CASCADE se encargan de eliminar las tarjetas y vinculaciones.
 * @route DELETE /api/v1/decks/:deckId
 * @param {string} req.params.deckId - ID del deck a eliminar
 * @returns {object} { msg: 'Deck eliminado' }
 */
exports.deleteDeck = async (req, res) => {
    const { deckId } = req.params;
    try {
        await Deck.deleteDeck(deckId);
        res.json({ msg: 'Deck eliminado' });
    } catch (error) {
        logger.error({ err: error.message }, 'Error al eliminar deck');
        res.status(500).json({ msg: 'Error al eliminar deck.' });
    }
};

/**
 * Elimina una flashcard específica por su ID.
 * @route DELETE /api/v1/decks/cards/:cardId
 * @param {string} req.params.cardId - ID de la flashcard a eliminar
 * @returns {object} { msg: 'Tarjeta eliminada' }
 */
exports.deleteCard = async (req, res) => {
    const { cardId } = req.params;
    try {
        await Deck.deleteFlashcard(cardId);
        res.json({ msg: 'Tarjeta eliminada' });
    } catch (error) {
        logger.error({ err: error.message }, 'Error al eliminar tarjeta');
        res.status(500).json({ msg: 'Error al eliminar tarjeta.' });
    }
};
