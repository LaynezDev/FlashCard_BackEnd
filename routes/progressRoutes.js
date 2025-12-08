// routes/progressRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const progressController = require('../controllers/progressController');

// Todas estas rutas requieren autenticación (auth)
// 1. Obtener tarjetas para estudiar
router.get('/decks/:deckId/study', auth, progressController.getFlashcardsForStudy);

// 2. Registrar el resultado de la revisión
router.post('/flashcards/:cardId/review', auth, progressController.registerReview);

// 3. Obtener estadísticas del usuario
// router.get('/stats', auth, progressController.getUserStats);

// 4. Reiniciar progreso
// router.delete('/decks/:deckId/progress', auth, progressController.resetDeckProgress);
// ...
router.get('/:deckId/stats', auth, progressController.getDeckStats);
// ...
module.exports = router;