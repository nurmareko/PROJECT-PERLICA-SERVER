// register account

import { logger } from '../application/logging.js'
import driverService from '../service/driver-service.js'

async function register(req, res, next) {
  try {
    const result = await driverService.register(req.body)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// verification email (account)

async function verificationEmailRegister(req, res, next) {
  try {
    const result = await driverService.verificationEmailRegister(req.body)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// resend otp register

async function resendOTPEmailRegister(req, res, next) {
  try {
    const result = await driverService.resendOTPEmailRegister(req.body)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// forgot password

async function forgotPassword(req, res, next) {
  try {
    const result = await driverService.forgotPassword(req.body)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// resend otp forgot password

async function resendOTPEmailForgotPassword(req, res, next) {
  try {
    const result = await driverService.resendOTPEmailForgotPassword(req.body)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// verification email forgot password

async function verificationEmailForgotPassword(req, res, next) {
  try {
    const result = await driverService.verificationEmailForgotPassword(
      req.body,
    )
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function resetPassword(req, res, next) {
  try {
    const result = await driverService.resetPassword(req.body)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// login

async function login(req, res, next) {
  try {
    const result = await driverService.login(req.body)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// isAuthenticated

async function checkAuthentication(req, res, next) {
  try {
    const result = await driverService.checkAuthentication(req.driver.email)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// get data

async function get(req, res, next) {
  try {
    const email = req.driver.email
    const result = await driverService.get(email)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// update

async function update(req, res, next) {
  try {
    // if (!req.file) {
    //   console.log("No file received");
    //   return res.send({
    //     success: false,
    //   });
    // } else {
    //   console.log(req.file);
    //   return res.send({
    //     success: true,
    //   });
    // }
    const email = req.driver.email
    const requestData = req.body

    // Memperbarui data email pada permintaan dengan email pelanggan
    requestData.email = email

    const requestFiles = req.file
    logger.info('Driver profile update requested', { hasFile: Boolean(requestFiles) })

    // Memanggil service untuk memperbarui data pelanggan
    const result = await driverService.update(requestData, requestFiles)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// update location
async function updateLocation(req, res, next) {
  try {
    const email = req.driver.email
    const requestData = req.body
    const result = await driverService.updateLocation(email, requestData)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function updateDeviceToken(req, res, next) {
  try {
    const email = req.driver.email
    const requestData = req.body
    const result = await driverService.updateDeviceToken(email, requestData)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// change password

async function changePassword(req, res, next) {
  try {
    const email = req.driver.email
    const result = await driverService.changePassword(email, req.body)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// logout

async function logout(req, res, next) {
  try {
    await driverService.logout(req.driver.email)
    res.status(200).json({
      data: 'OK',
    })
  }
  catch (e) {
    next(e)
  }
}

// update location
export default {
  register,
  verificationEmailRegister,
  resendOTPEmailRegister,
  forgotPassword,
  resendOTPEmailForgotPassword,
  verificationEmailForgotPassword,
  resetPassword,
  login,
  checkAuthentication,
  get,
  update,
  updateLocation,
  updateDeviceToken,
  changePassword,
  logout,
}
