// routes/deckRoutes.js

const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deckController');
const upload = require('../middleware/upload'); // Importamos Multer
const authMiddleware = require('../middleware/auth'); // Middleware de protección JWT

// --- Rutas de Decks (/api/v1/decks) ---

/**
 * @route   POST /api/v1/decks
 * @desc    Crear un nuevo deck
 * @access  Privado (Requiere token JWT)
 */
router.post('/', authMiddleware, deckController.createDeck);

/**
 * @route   GET /api/v1/decks
 * @desc    Obtener todos los decks disponibles para el usuario
 * @access  Privado
 */
router.get('/', authMiddleware, deckController.getDecks);

// --- Rutas de Flashcards (/api/v1/decks/:deckId/cards) ---

/**
 * @route   POST /api/v1/decks/cards
 * @desc    Crear una nueva tarjeta en un deck (soporta subida de una imagen)
 * @access  Privado
 */
router.post('/cards', authMiddleware,upload.single('imagen'), deckController.createFlashcard);
// router.post('/:deckId/cards', authMiddleware,upload.single('imagen'), deckController.createFlashcard);

/**
 * @route   GET /api/v1/decks/:deckId/cards
 * @desc    Listar todas las tarjetas asociadas a un deck específico
 * @access  Privado
 */
router.get('/:deckId/cards', authMiddleware, deckController.getFlashcards);

/**
 * @route   GET /api/v1/decks/:deckId/flashcards
 * @desc    Ruta alternativa para obtener las tarjetas de un deck directamente desde la DB
 * @access  Privado
 */
router.get('/:deckId/flashcards', authMiddleware, deckController.getCardsByDeck);

/**
 * @route   GET /api/v1/decks/:deckId/editor
 * @desc    ADMIN: Obtener los detalles completos y tarjetas de un deck para edición
 * @access  Privado (Administrador / Creador)
 */
router.get('/:deckId/editor', authMiddleware, deckController.getDeckDetails);

/**
 * @route   DELETE /api/v1/decks/:deckId
 * @desc    ADMIN: Eliminar un deck por su ID
 * @access  Privado (Administrador / Creador)
 */
router.delete('/:deckId', authMiddleware, deckController.deleteDeck);

/**
 * @route   DELETE /api/v1/decks/cards/:cardId
 * @desc    ADMIN: Eliminar una tarjeta específica por su ID
 * @access  Privado (Administrador / Creador)
 */
router.delete('/cards/:cardId', authMiddleware, deckController.deleteCard);

// ADMIN: Crear tarjeta (Ya tenías POST /:deckId/cards, asegúrate que funcione)

module.exports = router;