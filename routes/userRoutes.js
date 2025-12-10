const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Listar alumnos
router.get('/students', authMiddleware, userController.getStudentsByCenter);

// Crear alumno nuevo
router.post('/students', authMiddleware, userController.createStudent);
// GET /api/v1/users/teachers
router.get('/teachers', authMiddleware, userController.getTeachersByCenter);

// POST /api/v1/users/teachers
router.post('/teachers', authMiddleware, userController.createTeacher);
module.exports = router;