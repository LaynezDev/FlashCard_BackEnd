const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const authMiddleware = require('../middleware/auth');

// Grados
router.get('/grades', authMiddleware, schoolController.getGrades);
router.post('/grades', authMiddleware, schoolController.createGrade);

// Secciones
router.get('/grades/:gradeId/sections', authMiddleware, schoolController.getSections);
router.post('/sections', authMiddleware, schoolController.createSection);

module.exports = router;