const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Obtener el token del encabezado (Authorization: Bearer <token>)
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