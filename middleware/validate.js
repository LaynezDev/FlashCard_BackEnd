const Joi = require('joi');

/**
 * Middleware de validación genérico usando Joi.
 * Valida el contenido de req[property] (por defecto: body) contra un esquema.
 * Si la validación falla, retorna 400 con los mensajes de error detallados.
 * @param {Joi.Schema} schema - Esquema Joi contra el cual validar
 * @param {string} [property='body'] - Propiedad del request a validar ('body', 'query', 'params')
 * @returns {function} Middleware Express
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], { abortEarly: false });
        if (error) {
            const messages = error.details.map(d => d.message);
            return res.status(400).json({ msg: 'Datos inválidos', errors: messages });
        }
        next();
    };
};

module.exports = validate;
