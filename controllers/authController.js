// Función de login, mapeada a POST /api/v1/auth/login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    // 1. Verificar si el email y la contraseña están presentes
    if (!email || !password) {
        return res.status(400).json({ msg: 'Por favor, introduce email y contraseña.' });
    }

    try {
        // 2. Buscar el usuario en la base de datos
        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(401).json({ msg: 'Credenciales inválidas.' });
        }

        // 3. Comparar la contraseña proporcionada con el hash almacenado
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ msg: 'Credenciales inválidas.' });
        }

        // 4. Generar el JSON Web Token (JWT)
        const payload = {
            user: {
                id_usuario: user.id_usuario,
                tipo_usuario: user.tipo_usuario,
                id_centro: user.id_centro // <--- ¡IMPORTANTE!
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET, // Clave secreta definida en .env
            { expiresIn: '12h' }, // El token expira en 1 hora
            (err, token) => {
                if (err) throw err;
                
                // 5. Enviar el token al cliente (PHP, React, etc.)
                res.json({ token });
            }
        );

    } catch (error) {
        console.error('Error en el login:', error.message);
        res.status(500).send('Error del servidor.');
    }
};

// controllers/authController.js (Añadir debajo de loginUser)

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User'); 

// ... (Función loginUser permanece igual) ...

// Función de registro, mapeada a POST /api/v1/auth/register
exports.registerUser = async (req, res) => {
    const { nombre, email, password, tipo_usuario, id_centro } = req.body;
    // Validación básica de campos requeridos
    if (!nombre || !email || !password || !tipo_usuario || !id_centro) {
        return res.status(400).json({ msg: 'Por favor, introduce todos los campos requeridos.' });
    }

    try {
        // 1. Verificar si el usuario ya existe
        let userExists = await User.findByEmail(email);
        if (userExists) {
            return res.status(400).json({ msg: 'El usuario con ese email ya existe.' });
        }

        // 2. Hashear la contraseña de forma segura
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Crear el nuevo usuario en la base de datos
        const newUser = await User.create({
            nombre,
            email,
            password_hash,
            tipo_usuario,
            id_centro
        });

        // 4. (Opcional) Generar y devolver un token para el inicio de sesión inmediato
        const payload = {
            user: {
                id_usuario: newUser.id_usuario, // Usar el ID devuelto por MySQL
                tipo_usuario: tipo_usuario,
                id_centro: user.id_centro // <--- ¡IMPORTANTE!
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ 
                    msg: 'Usuario registrado exitosamente',
                    token, 
                    userId: newUser.id_usuario 
                });
            }
        );

    } catch (error) {
        console.error('Error al registrar el usuario:', error.message);
        // Error 500 para errores de servidor (DB, hash, etc.)
        res.status(500).send('Error del servidor al registrar el usuario.');
    }
};