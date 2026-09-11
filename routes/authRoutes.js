const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../validators/authValidators');

router.post('/login', validate(loginSchema), authController.loginUser);
router.post('/register', validate(registerSchema), authController.registerUser);

module.exports = router;
