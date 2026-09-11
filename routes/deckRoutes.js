const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deckController');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createDeckSchema, createFlashcardSchema } = require('../validators/deckValidators');

router.post('/', authMiddleware, validate(createDeckSchema), deckController.createDeck);
router.get('/', authMiddleware, deckController.getDecks);

router.post('/cards', authMiddleware, upload.single('imagen'), validate(createFlashcardSchema), deckController.createFlashcard);

router.get('/:deckId/cards', authMiddleware, deckController.getFlashcards);
router.get('/:deckId/flashcards', authMiddleware, deckController.getCardsByDeck);
router.get('/:deckId/editor', authMiddleware, deckController.getDeckDetails);

router.delete('/:deckId', authMiddleware, deckController.deleteDeck);
router.delete('/cards/:cardId', authMiddleware, deckController.deleteCard);

module.exports = router;
