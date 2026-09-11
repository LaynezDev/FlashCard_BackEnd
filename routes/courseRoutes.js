const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createCourseSchema, enrollStudentSchema } = require('../validators/courseValidators');

router.get('/', authMiddleware, courseController.getMyCourses);
router.get('/:courseId/decks', authMiddleware, courseController.getDecksByCourse);

router.post('/', authMiddleware, validate(createCourseSchema), courseController.createCourse);
router.delete('/:courseId', authMiddleware, courseController.deleteCourse);

router.post('/enroll', authMiddleware, validate(enrollStudentSchema), courseController.enrollStudent);

module.exports = router;
