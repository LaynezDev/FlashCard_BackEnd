const Joi = require('joi');

const createDeckSchema = Joi.object({
    nombre_deck: Joi.string().min(1).max(255).required(),
    descripcion: Joi.string().max(1000).allow('', null),
    id_curso: Joi.number().integer().positive().allow(null),
    publico: Joi.boolean().allow(null)
});

const createFlashcardSchema = Joi.object({
    id_deck: Joi.number().integer().positive().required(),
    pregunta: Joi.string().min(1).max(5000).required(),
    respuesta: Joi.string().min(1).max(5000).required(),
    tipo: Joi.string().valid('texto', 'imagen', 'narrado', 'traduccion').allow(null)
});

module.exports = { createDeckSchema, createFlashcardSchema };
