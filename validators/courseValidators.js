const Joi = require('joi');

const createCourseSchema = Joi.object({
    nombre_curso: Joi.string().min(1).max(255).required(),
    descripcion: Joi.string().max(1000).allow('', null),
    id_profesor: Joi.number().integer().positive().allow(null)
});

const enrollStudentSchema = Joi.object({
    studentId: Joi.number().integer().positive().required(),
    courseId: Joi.number().integer().positive().required()
});

module.exports = { createCourseSchema, enrollStudentSchema };
