const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string().email().required().max(320),
    password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
    nombre: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required().max(320),
    password: Joi.string().min(6).required(),
    tipo_usuario: Joi.string().valid('Alumno', 'Profesor', 'Admin').required(),
    id_centro: Joi.number().integer().positive().required()
});

module.exports = { loginSchema, registerSchema };
