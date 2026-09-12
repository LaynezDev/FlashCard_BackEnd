const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT.
 * Extrae el token del encabezado Authorization, lo verifica con JWT_SECRET
 * y adjunta el payload del usuario (id_usuario, tipo_usuario, id_centro) a req.user.
 * Rechaza la petición si no hay token o si es inválido/expirado.
 * @param {object} req - Express request (debe incluir encabezado Authorization: Bearer <token>)
 * @param {object} res - Express response
 * @param {function} next - Siguiente middleware en la cadena
 */
module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ msg: 'Acceso denegado. No hay token.' });
    }

    try {
        // 2. Verificar el token usando la clave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Adjuntar la información del usuario a la petición
        req.user = decoded.user; // Generalmente contiene el id_usuario
        next();
    } catch (e) {
        res.status(401).json({ msg: 'Token no válido.' });
    }
};