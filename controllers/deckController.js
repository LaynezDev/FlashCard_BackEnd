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
// exports.createDeck = async (req, res) => {
//     console.log("Request body para crear deck:", req.body);
//     const id_creador = req.user.id_usuario;
//     // Ahora recibimos id_curso del body
//     const { nombre_deck, descripcion, publico, id_curso } = req.body; 

//     try {
//         // 1. Crear el Deck
//         const deckResult = await Deck.createDeck({ 
//             nombre_deck, descripcion, id_creador, id_curso, publico 
//         });

//         // 2. Vincularlo al Curso en la tabla intermedia (DeckCursos)
//         if (id_curso) {
//             await db.query('INSERT INTO DeckCursos (id_deck, id_curso) VALUES (?, ?)', [deckResult.id_deck, id_curso]);
//         }

//         res.status(201).json(deckResult);
//     } catch (error) {
//         console.log("Error al crear el deck:", error);
//         res.status(500).json({ msg: 'Error interno del servidor al crear el deck.' });
//     }
// };

exports.getDecks = async (req, res) => {
    // Supongamos que el ID del curso del usuario está en el token o lo buscamos
    const userId = req.user.id_usuario;
    // Esto es un placeholder; en un entorno real, buscarías el curso del usuario en la DB
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
    const { deckId } = req.params;
    const { pregunta, respuesta, imagen_url } = req.body;
    
    // Validación de permisos: Solo el creador del deck debería poder añadir tarjetas.
    // **NOTA:** Esto requiere una verificación adicional en el modelo o controlador
    // para asegurar que req.user.id_usuario es el creador de deckId.

    if (!pregunta || !respuesta) {
        return res.status(400).json({ msg: 'Pregunta y respuesta son obligatorias.' });
    }

    try {
        const newCard = await Deck.createFlashcard({ id_deck: deckId, pregunta, respuesta, imagen_url });
        res.status(201).json(newCard);
    } catch (error) {
        console.error('Error al crear la flashcard:', error);
        res.status(500).json({ msg: 'Error interno del servidor al crear la tarjeta.' });
    }
};

exports.getFlashcards = async (req, res) => {
    const { deckId } = req.params;
    
    // Idealmente, se debe verificar que el usuario tenga permiso para ver este deck
    
    try {
        const cards = await Deck.getFlashcardsByDeck(deckId);
        res.json(cards);
    } catch (error) {
        console.error('Error al obtener las flashcards:', error);
        res.status(500).json({ msg: 'Error interno del servidor al listar las tarjetas.' });
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