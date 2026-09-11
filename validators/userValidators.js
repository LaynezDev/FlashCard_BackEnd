const Joi = require('joi');

const createStudentSchema = Joi.object({
    nombre: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required().max(320),
    password: Joi.string().min(6).required()
});

const createTeacherSchema = Joi.object({
    nombre: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required().max(320),
    password: Joi.string().min(6).required()
});

const updatePasswordSchema = Joi.object({
    password: Joi.string().min(6).required()
});

module.exports = { createStudentSchema, createTeacherSchema, updatePasswordSchema };
