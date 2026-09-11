const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createGradeSchema, createSectionSchema } = require('../validators/schoolValidators');

router.get('/grades', authMiddleware, schoolController.getGrades);
router.post('/grades', authMiddleware, validate(createGradeSchema), schoolController.createGrade);

router.get('/grades/:gradeId/sections', authMiddleware, schoolController.getSections);
router.post('/sections', authMiddleware, validate(createSectionSchema), schoolController.createSection);

module.exports = router;
