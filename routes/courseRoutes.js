const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/auth');

// GET /api/v1/courses (Mis cursos)
router.get('/', authMiddleware, courseController.getMyCourses);

// GET /api/v1/courses/:courseId/decks (Decks de un curso)
router.get('/:courseId/decks', authMiddleware, courseController.getDecksByCourse);

router.post('/', authMiddleware, courseController.createCourse);
router.delete('/:courseId', authMiddleware, courseController.deleteCourse);

// POST /api/v1/courses/enroll
router.post('/enroll', authMiddleware, courseController.enrollStudent);
module.exports = router;