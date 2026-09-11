const Joi = require('joi');

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
