const logger = require('../config/logger');

/**
 * Middleware global de manejo de errores.
 * Captura errores no atrapados en rutas o middlewares anteriores.
 * Clasifica errores por tipo: ValidationError (400), JsonWebTokenError (401),
 * TokenExpiredError (401), o genéricos (500).
 * Registra cada error con stack trace completo via Pino.
 * @param {Error} err - Objeto de error capturado
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Siguiente middleware (no utilizado, requerido por Express)
 */
const errorHandler = (err, req, res, next) => {
    logger.error({ err: err.message, stack: err.stack }, 'Error no capturado');

    if (err.name === 'ValidationError') {
        return res.status(400).json({ msg: err.message });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ msg: 'Token no válido.' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ msg: 'Token expirado.' });
    }

    res.status(err.status || 500).json({
        msg: err.message || 'Error interno del servidor'
    });
};

module.exports = errorHandler;
