const Joi = require('@hapi/joi');

const signinSchema = Joi.object({
    username : Joi.string().required().min(6),
    email : Joi.string().required().email(),
    password : Joi.string().required().min(6)
})

const loginSchema = Joi.object({
    email : Joi.string().required().email(),
    password : Joi.string().required().min(6)
})

const signinValidation = (data) => {
    return signinSchema.validate(data);
}

const loginvalidation = (data) => {
    return loginSchema.validate(data);
}

module.exports = {
    signinValidation,
    loginvalidation
}