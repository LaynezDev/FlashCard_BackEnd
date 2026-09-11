const Joi = require('joi');

const createGradeSchema = Joi.object({
    nombre_grado: Joi.string().min(1).max(50).required()
});

const createSectionSchema = Joi.object({
    nombre_seccion: Joi.string().min(1).max(20).required(),
    id_grado: Joi.number().integer().positive().required()
});

module.exports = { createGradeSchema, createSectionSchema };
