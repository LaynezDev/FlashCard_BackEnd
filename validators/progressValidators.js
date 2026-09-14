const Joi = require('joi');

const registerReviewSchema = Joi.object({
    nivel_dominio: Joi.number().integer().min(1).max(5).required()
});

module.exports = { registerReviewSchema };
