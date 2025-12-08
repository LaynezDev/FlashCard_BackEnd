// routes/deckRoutes.js

const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deckController');
const authMiddleware = require('../middleware/auth'); // Middleware de protección JWT

// --- Rutas de Decks (/api/v1/decks) ---

// POST /api/v1/decks - Crear un nuevo deck
router.post('/', authMiddleware, deckController.createDeck);

// GET /api/v1/decks - Obtener todos los decks disponibles para el usuario
router.get('/', authMiddleware, deckController.getDecks);

// --- Rutas de Flashcards (/api/v1/decks/:deckId/cards) ---

// POST /api/v1/decks/:deckId/cards - Crear una nueva tarjeta en un deck
router.post('/:deckId/cards', authMiddleware, deckController.createFlashcard);

// GET /api/v1/decks/:deckId/cards - Listar todas las tarjetas de un deck
router.get('/:deckId/cards', authMiddleware, deckController.getFlashcards);

// ADMIN: Obtener todas las tarjetas de un deck para editar
router.get('/:deckId/editor', authMiddleware, deckController.getDeckDetails);

// ADMIN: Eliminar un deck
router.delete('/:deckId', authMiddleware, deckController.deleteDeck);

// ADMIN: Eliminar una tarjeta específica
router.delete('/cards/:cardId', authMiddleware, deckController.deleteCard);

// ADMIN: Crear tarjeta (Ya tenías POST /:deckId/cards, asegúrate que funcione)

module.exports = router;