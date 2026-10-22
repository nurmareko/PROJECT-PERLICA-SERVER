import express from 'express'
import adminController from '../controller/admin-controller.js'
import customerController from '../controller/customer-controller.js'
import driverController from '../controller/driver-controller.js'

const publicRouter = new express.Router()

// customer API

// auth customer

publicRouter.post('/api/customers', customerController.register)
publicRouter.post(
  '/api/customers/verificationEmailRegister',
  customerController.verificationEmailRegister,
)
publicRouter.post(
  '/api/customers/resendOTPEmailRegister',
  customerController.resendOTPEmailRegister,
)
publicRouter.post('/api/customers/login', customerController.login)
publicRouter.post(
  '/api/customers/forgotPassword',
  customerController.forgotPassword,
)
publicRouter.post(
  '/api/customers/verificationEmailForgotPassword',
  customerController.verificationEmailForgotPassword,
)
publicRouter.post(
  '/api/customers/resendOTPEmailForgotPassword',
  customerController.resendOTPEmailForgotPassword,
)
publicRouter.patch(
  '/api/customers/resetPassword',
  customerController.resetPassword,
)

// auth driver

publicRouter.post('/api/drivers', driverController.register)
publicRouter.post(
  '/api/drivers/verificationEmailRegister',
  driverController.verificationEmailRegister,
)
publicRouter.post(
  '/api/drivers/resendOTPEmailRegister',
  driverController.resendOTPEmailRegister,
)
publicRouter.post(
  '/api/drivers/forgotPassword',
  driverController.forgotPassword,
)
publicRouter.post(
  '/api/drivers/resendOTPEmailForgotPassword',
  driverController.resendOTPEmailForgotPassword,
)

publicRouter.post(
  '/api/drivers/verificationEmailForgotPassword',
  driverController.verificationEmailForgotPassword,
)

publicRouter.patch(
  '/api/drivers/resetPassword',
  driverController.resetPassword,
)
publicRouter.post('/api/drivers/login', driverController.login)

// admin

publicRouter.post('/api/admin/login', adminController.login)

export { publicRouter }
