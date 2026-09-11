const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createStudentSchema, createTeacherSchema, updatePasswordSchema } = require('../validators/userValidators');

router.get('/students', authMiddleware, userController.getStudentsByCenter);
router.post('/students', authMiddleware, validate(createStudentSchema), userController.createStudent);

router.get('/teachers', authMiddleware, userController.getTeachersByCenter);
router.post('/teachers', authMiddleware, validate(createTeacherSchema), userController.createTeacher);

router.put('/students/:id/password', authMiddleware, validate(updatePasswordSchema), userController.updateStudentPassword);

module.exports = router;
