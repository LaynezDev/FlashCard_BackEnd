const pino = require('pino');

/**
 * Configuración del logger Pino.
 * En desarrollo: imprime a stdout con formato legible.
 * En producción: imprime JSON estructurado (máquina).
 * Nivel configurable via variable de entorno LOG_LEVEL (default: 'info').
 */
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino/file', options: { destination: 1 } }
        : undefined,
});

module.exports = logger;
