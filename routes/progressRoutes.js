const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const progressController = require('../controllers/progressController');
const validate = require('../middleware/validate');
const { registerReviewSchema } = require('../validators/progressValidators');

router.get('/decks/:deckId/study', auth, progressController.getFlashcardsForStudy);

router.post('/flashcards/:cardId/review', auth, validate(registerReviewSchema), progressController.registerReview);

router.get('/:deckId/stats', auth, progressController.getDeckStats);

router.get('/report/:courseId/:deckId', auth, progressController.getTeacherReport);
router.post('/review', auth, validate(registerReviewSchema), progressController.registerReview);

module.exports = router;
