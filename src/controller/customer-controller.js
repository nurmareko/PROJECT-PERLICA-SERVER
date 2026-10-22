import { logger } from '../application/logging.js'
import customerService from '../service/customer-service.js'

// register account

async function register(req, res, next) {
  try {
    const result = await customerService.register(req.body)
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
    const result = await customerService.verificationEmailRegister(req.body)
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
    const result = await customerService.resendOTPEmailRegister(req.body)
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
    const result = await customerService.forgotPassword(req.body)
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
    const result = await customerService.resendOTPEmailForgotPassword(req.body)
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
    const result = await customerService.verificationEmailForgotPassword(
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
    const result = await customerService.resetPassword(req.body)
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
    const result = await customerService.login(req.body)
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
    const result = await customerService.checkAuthentication(
      req.customer.email,
    )
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
    const email = req.customer.email
    const result = await customerService.get(email)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// update data

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
    const email = req.customer.email
    const requestData = req.body

    // Memperbarui data email pada permintaan dengan email pelanggan
    requestData.email = email

    const requestFiles = req.file
    logger.info('Customer profile update requested', { hasFile: Boolean(requestFiles) })

    // Memanggil service untuk memperbarui data pelanggan
    const result = await customerService.update(requestData, requestFiles)

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
    const email = req.customer.email
    const result = await customerService.changePassword(email, req.body)

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
    const email = req.customer.email
    const requestData = req.body
    const result = await customerService.updateLocation(email, requestData)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

// update token device
async function updateDeviceToken(req, res, next) {
  try {
    const email = req.customer.email
    const requestData = req.body
    const result = await customerService.updateDeviceToken(email, requestData)

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
    await customerService.logout(req.customer.email)
    res.status(200).json({
      data: 'OK',
    })
  }
  catch (e) {
    next(e)
  }
}

export default {
  register,
  resendOTPEmailRegister,
  verificationEmailRegister,
  forgotPassword,
  verificationEmailForgotPassword,
  resendOTPEmailForgotPassword,
  resetPassword,
  login,
  checkAuthentication,
  get,
  update,
  changePassword,
  updateLocation,
  updateDeviceToken,
  logout,
}
