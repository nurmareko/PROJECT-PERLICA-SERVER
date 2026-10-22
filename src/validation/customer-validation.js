import Joi from 'joi'

const registerCustomerValidation = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  password: Joi.string().required(),
})
const resendOTPEmailRegisterCustomerValidation = Joi.object({
  email: Joi.string().email().required(),
})

const verificationEmailRegisterCustomerValidation = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string()
    .length(4)
    .pattern(/^\d+$/)
    .required(),
})

const forgotPasswordCustomerValidation = Joi.object({
  email: Joi.string().email().required(),
})

const resendOTPEmailForgotPasswordCustomerValidation = Joi.object({
  email: Joi.string().email().required(),
})

const verificationEmailForgotPasswordCustomerValidation = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string()
    .length(4)
    .pattern(/^\d+$/)
    .required(),
})

const resetPasswordCustomerValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

const loginCustomerValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

const checkAuthenticationCustomerValidation = Joi.string().email().required()

const getCustomerValidation = Joi.string().email().required()

const updateCustomerValidation = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  phoneNumber: Joi.string().required(),
})

const changePasswordCustomerValidation = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().required().disallow(Joi.ref('oldPassword')),
})

const updateLocationCustomerValidation = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
})

const updateDeviceTokenCustomerValidation = Joi.object({
  deviceToken: Joi.string().required(),
})

const logoutCustomerValidation = Joi.string().email().required()

export {
  changePasswordCustomerValidation,
  checkAuthenticationCustomerValidation,
  forgotPasswordCustomerValidation,
  getCustomerValidation,
  loginCustomerValidation,
  logoutCustomerValidation,
  registerCustomerValidation,
  resendOTPEmailForgotPasswordCustomerValidation,
  resendOTPEmailRegisterCustomerValidation,
  resetPasswordCustomerValidation,
  updateCustomerValidation,
  updateDeviceTokenCustomerValidation,
  updateLocationCustomerValidation,
  verificationEmailForgotPasswordCustomerValidation,
  verificationEmailRegisterCustomerValidation,
}
