// controllers/deckController.js

const Deck = require('../models/Deck');

// --- Lógica de Decks ---

exports.createDeck = async (req, res) => {
    const id_creador = req.user.id_usuario; // Obtenido del JWT
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
        console.error('Error al crear el deck:', error);
        res.status(500).json({ msg: 'Error interno del servidor al crear el deck.' });
    }
};

exports.getDecks = async (req, res) => {
    const userId = req.user.id_usuario;
    const userCourseId = req.user.id_curso || null; 

    try {
        const decks = await Deck.getAvailableDecks(userId, userCourseId);
        res.json(decks);
    } catch (error) {
        console.error('Error al obtener los decks:', error);
        res.status(500).json({ msg: 'Error interno del servidor al listar los decks.' });
    }
};

// --- Lógica de Flashcards ---

exports.createFlashcard = async (req, res) => {
    const { id_deck, pregunta, respuesta, tipo } = req.body;
    let imagen_url = null;
    // Si Multer subió un archivo, guardamos la URL relativa
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
        console.error('Error al crear la flashcard:', error);
        res.status(500).json({ msg: 'Error interno del servidor al crear la tarjeta.' });
    }
};

exports.getFlashcards = async (req, res) => {
    const { deckId } = req.params;
    
    try {
        const cards = await Deck.getFlashcardsByDeck(deckId);
        res.json(cards);
    } catch (error) {
        console.error('Error al obtener las flashcards:', error);
        res.status(500).json({ msg: 'Error interno del servidor al listar las tarjetas.' });
    }
};

exports.getCardsByDeck = async (req, res) => {
    const { deckId } = req.params;
    try {
        const query = 'SELECT * FROM Flashcards WHERE id_deck = ?';
        const [rows] = await db.query(query, [deckId]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener tarjetas por deck:', error);
        res.status(500).json({ msg: 'Error al obtener tarjetas' });
    }
};

// Obtener detalles completos del deck para edición
exports.getDeckDetails = async (req, res) => {
    const { deckId } = req.params;
    try {
        const cards = await Deck.getAllCardsInDeck(deckId);
        res.json({ cards }); // Podrías devolver info del deck también
    } catch (error) {
        res.status(500).json({ msg: 'Error al cargar tarjetas.' });
    }
};

// Eliminar deck
exports.deleteDeck = async (req, res) => {
    const { deckId } = req.params;
    try {
        await Deck.deleteDeck(deckId);
        res.json({ msg: 'Deck eliminado' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar deck.' });
    }
};

// Eliminar carta
exports.deleteCard = async (req, res) => {
    const { cardId } = req.params;
    try {
        await Deck.deleteFlashcard(cardId);
        res.json({ msg: 'Tarjeta eliminada' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar tarjeta.' });
    }
};