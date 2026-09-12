const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Inicia sesión de un usuario existente.
 * Valida credenciales (email + password) y genera un JWT de 12h.
 * @route POST /api/v1/auth/login
 * @param {string} req.body.email - Email del usuario
 * @param {string} req.body.password - Contraseña en texto plano
 * @returns {object} { token: string } con el JWT generado
 */
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Por favor, introduce email y contraseña.' });
    }

    try {
        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(401).json({ msg: 'Credenciales inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ msg: 'Credenciales inválidas.' });
        }

        const payload = {
            user: {
                id_usuario: user.id_usuario,
                tipo_usuario: user.tipo_usuario,
                id_centro: user.id_centro
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '12h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (error) {
        logger.error({ err: error.message }, 'Error en el login');
        res.status(500).send('Error del servidor.');
    }
};

/**
 * Registra un nuevo usuario en el sistema.
 * Verifica que el email no exista, hashea la contraseña con bcrypt (salt 10)
 * y genera un JWT de 1h para inicio de sesión inmediato.
 * @route POST /api/v1/auth/register
 * @param {string} req.body.nombre - Nombre completo del usuario
 * @param {string} req.body.email - Email único del usuario
 * @param {string} req.body.password - Contraseña (mínimo 6 caracteres)
 * @param {string} req.body.tipo_usuario - Rol: 'Alumno', 'Profesor' o 'Admin'
 * @param {number} req.body.id_centro - ID del centro educativo al que pertenece
 * @returns {object} { msg, token, userId } con el JWT y ID del usuario creado
 */
exports.registerUser = async (req, res) => {
    const { nombre, email, password, tipo_usuario, id_centro } = req.body;

    if (!nombre || !email || !password || !tipo_usuario || !id_centro) {
        return res.status(400).json({ msg: 'Por favor, introduce todos los campos requeridos.' });
    }

    try {
        let userExists = await User.findByEmail(email);
        if (userExists) {
            return res.status(400).json({ msg: 'El usuario con ese email ya existe.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            nombre,
            email,
            password_hash,
            tipo_usuario,
            id_centro
        });

        const payload = {
            user: {
                id_usuario: newUser.id_usuario,
                tipo_usuario: tipo_usuario,
                id_centro: newUser.id_centro
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
        logger.error({ err: error.message }, 'Error al registrar el usuario');
        res.status(500).send('Error del servidor al registrar el usuario.');
    }
};
