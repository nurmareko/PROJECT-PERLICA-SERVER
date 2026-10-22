import Joi from 'joi'

const loginAdminValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

export { loginAdminValidation }
