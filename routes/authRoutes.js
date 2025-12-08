// routes/authRoutes.js (EJEMPLO)

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// **DEBE ser POST, no GET**
router.post('/login', authController.loginUser); // RUTA CORRECTA
// 🆕 Ruta para crear un nuevo usuario
router.post('/register', authController.registerUser);
// router.get('/login', ...);  <-- ¡EVITAR ESTO PARA EL LOGIN!

module.exports = router;