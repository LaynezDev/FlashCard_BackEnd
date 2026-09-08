const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);

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
