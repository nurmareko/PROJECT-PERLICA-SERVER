import process from 'node:process'
import bcrypt from 'bcryptjs'

import {
  getDownloadURL,

  ref,
  uploadBytesResumable,
} from 'firebase/storage'
import { v4 as uuid } from 'uuid'
import { prismaClient } from '../application/database.js'
import { logger } from '../application/logging.js'
import { storage } from '../config/firebase-client.config.js'
import { ResponseError } from '../error/response-error.js'
import { sendOTPForgotPasswordCustomerByEmail } from '../utils/sendEmailForgotPassword.js'
import { sendOTPRegisterCustomerByEmail } from '../utils/sendEmailRegister.js'
import {
  changePasswordCustomerValidation,
  checkAuthenticationCustomerValidation,
  forgotPasswordCustomerValidation,
  getCustomerValidation,
  loginCustomerValidation,
  registerCustomerValidation,
  resendOTPEmailForgotPasswordCustomerValidation,
  resendOTPEmailRegisterCustomerValidation,
  resetPasswordCustomerValidation,
  updateCustomerValidation,
  updateDeviceTokenCustomerValidation,
  updateLocationCustomerValidation,
  verificationEmailForgotPasswordCustomerValidation,
  verificationEmailRegisterCustomerValidation,
} from '../validation/customer-validation.js'
import { validate } from '../validation/validation.js'

async function register(request) {
  const customer = validate(registerCustomerValidation, request)

  const countCustomer = await prismaClient.customer.count({
    where: {
      email: customer.email,
    },
  })

  const customerDatabase = await prismaClient.customer.findUnique({
    where: {
      email: customer.email,
    },
  })

  if (countCustomer === 1) {
    if (customerDatabase.verifiedEmail) {
      throw new ResponseError(400, 'registered', customer.email)
    }

    throw new ResponseError(400, 'unverified', customer.email)

    // return {
    //   status:'error',
    //   info: 'unverified-email',
    //   email: customer.email
    // }
  }

  const bcryptSaltRounds = 10
  customer.password = await bcrypt.hash(customer.password, bcryptSaltRounds)

  customer.photo = process.env.FALLBACK_CUSTOMER_AVATAR_URL || null

  const otp = Math.floor(1000 + Math.random() * 9000).toString()
  customer.otp = otp

  const expirationTime = new Date(Date.now() + 60_000).toISOString()
  customer.otpExpiry = expirationTime

  customer.verifiedEmail = false
  customer.status = false

  // Kirim OTP via email
  try {
    await sendOTPRegisterCustomerByEmail(customer.email, otp, customer.name)
    logger.info('Email sent successfully.')
  }
  catch (error) {
    console.error('Error sending email:', error)
    throw new ResponseError(500, 'Internal Server Error')
  }

  return prismaClient.customer.create({
    data: customer,
    select: {
      // id: true,
      email: true,
    },
  })
}

async function resendOTPEmailRegister(request) {
  const { email } = validate(resendOTPEmailRegisterCustomerValidation, request)

  const existingCustomer = await prismaClient.customer.findUnique({
    where: {
      email,
    },
  })

  if (!existingCustomer) {
    throw new ResponseError(404, 'Customer tidak ditemukan', email)
  }

  if (existingCustomer.verifiedEmail) {
    throw new ResponseError(400, 'Email sudah diverifikasi', email)
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString()
  const expirationTime = new Date(Date.now() + 60_000).toISOString()

  try {
    await sendOTPRegisterCustomerByEmail(email, otp, existingCustomer.name)
    logger.info('Email sent successfully.')
  }
  catch (error) {
    console.error('Error sending email:', error)
    throw new ResponseError(500, 'Internal Server Error')
  }

  return await prismaClient.customer.update({
    where: {
      email,
    },
    data: {
      otp,
      otpExpiry: expirationTime,
    },
    select: {
      email: true,
    },
  })
}

async function verificationEmailRegister(request) {
  const { email, otp } = validate(
    verificationEmailRegisterCustomerValidation,
    request,
  )

  const existingCustomer = await prismaClient.customer.findUnique({
    where: {
      email,
    },
  })

  if (!existingCustomer) {
    throw new ResponseError(404, 'Customer tidak ditemukan', email)
  }

  if (
    existingCustomer.otp !== otp
    || new Date(existingCustomer.otpExpiry ?? NaN).getTime() < Date.now()
  ) {
    throw new ResponseError(
      400,
      'Kode OTP tidak valid atau telah kadaluarsa',
      existingCustomer.email,
    )
  }

  return await prismaClient.customer.update({
    where: {
      email,
    },
    data: {
      otp: null,
      otpExpiry: null,
      verifiedEmail: true,
      status: true,
    },
    select: {
      email: true,
    },
  })
}

async function forgotPassword(request) {
  const { email } = validate(forgotPasswordCustomerValidation, request)

  const existingCustomer = await prismaClient.customer.findUnique({
    where: {
      email,
    },
  })

  if (!existingCustomer) {
    throw new ResponseError(404, 'Customer tidak ditemukan', email)
  }

  if (!existingCustomer.verifiedEmail) {
    throw new ResponseError(404, 'Customer tidak ditemukan', email)
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString()
  const expirationTime = new Date(Date.now() + 60_000).toISOString()

  try {
    await sendOTPForgotPasswordCustomerByEmail(
      email,
      otp,
      existingCustomer.name,
    )
    logger.info('Email sent successfully.')
  }
  catch (error) {
    console.error('Error sending email:', error)
    throw new ResponseError(500, 'Internal Server Error')
  }

  return await prismaClient.customer.update({
    where: {
      email,
    },
    data: {
      otp,
      otpExpiry: expirationTime,
    },
    select: {
      email: true,
    },
  })
}
async function resendOTPEmailForgotPassword(request) {
  const { email } = validate(
    resendOTPEmailForgotPasswordCustomerValidation,
    request,
  )

  const existingCustomer = await prismaClient.customer.findUnique({
    where: {
      email,
    },
  })

  if (!existingCustomer) {
    throw new ResponseError(404, 'Customer tidak ditemukan', email)
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString()
  const expirationTime = new Date(Date.now() + 60_000).toISOString()

  try {
    await sendOTPForgotPasswordCustomerByEmail(
      email,
      otp,
      existingCustomer.name,
    )
    logger.info('Email sent successfully.')
  }
  catch (error) {
    console.error('Error sending email:', error)
    throw new ResponseError(500, 'Internal Server Error')
  }

  return await prismaClient.customer.update({
    where: {
      email,
    },
    data: {
      otp,
      otpExpiry: expirationTime,
    },
    select: {
      email: true,
    },
  })
}

async function verificationEmailForgotPassword(request) {
  const { email, otp } = validate(
    verificationEmailForgotPasswordCustomerValidation,
    request,
  )

  const existingCustomer = await prismaClient.customer.findUnique({
    where: {
      email,
    },
  })

  if (!existingCustomer) {
    throw new ResponseError(404, 'Customer tidak ditemukan', email)
  }

  if (
    existingCustomer.otp !== otp
    || new Date(existingCustomer.otpExpiry ?? NaN).getTime() < Date.now()
  ) {
    throw new ResponseError(
      400,
      'Kode OTP tidak valid atau telah kadaluarsa',
      existingCustomer.email,
    )
  }

  return await prismaClient.customer.update({
    where: {
      email,
    },
    data: {
      otp: null,
      otpExpiry: null,
    },
    select: {
      email: true,
    },
  })
}

async function resetPassword(request) {
  const customer = validate(resetPasswordCustomerValidation, request)

  const customerDatabase = await prismaClient.customer.findUnique({
    where: {
      email: customer.email,
    },
  })

  if (!customerDatabase || !customerDatabase.verifiedEmail) {
    throw new ResponseError(
      400,
      'customer tidak dapat ditemukan',
      customer.email,
    )
  }

  const bcryptSaltRounds = 10
  customer.password = await bcrypt.hash(customer.password, bcryptSaltRounds)

  return prismaClient.customer.update({
    where: {
      email: customer.email,
    },
    data: {
      password: customer.password,
    },
    select: {
      email: true,
    },
  })
}

async function login(request) {
  const loginRequest = validate(loginCustomerValidation, request)

  const customer = await prismaClient.customer.findUnique({
    where: {
      email: loginRequest.email,
    },
  })

  if (!customer) {
    throw new ResponseError(401, 'Kredensial tidak valid', loginRequest.email)
  }

  if (customer.status === false) {
    throw new ResponseError(403, 'Akun Anda dinonaktifkan', loginRequest.email)
  }

  if (customer.verifiedEmail) {
    const isPasswordValid = await bcrypt.compare(
      loginRequest.password,
      customer.password,
    )

    if (!isPasswordValid) {
      throw new ResponseError(
        401,
        'Kredensial tidak valid',
        loginRequest.email,
      )
    }

    const token = uuid().toString()
    const tokenExpiry = new Date()
    tokenExpiry.setDate(tokenExpiry.getDate() + 1)

    return prismaClient.customer.update({
      data: {
        token,
        tokenExpiry,
      },
      where: {
        email: customer.email,
      },
      select: {
        token: true,
      },
    })
  }
  else {
    throw new ResponseError(401, 'Kredensial tidak valid', loginRequest.email)
  }
}

async function checkAuthentication(email) {
  email = validate(checkAuthenticationCustomerValidation, email)

  const customer = await prismaClient.customer.findUnique({
    where: {
      email,
    },
    select: {
      token: true,
    },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer tidak dapat ditemukan', email)
  }

  return customer
}

async function get(email) {
  email = validate(getCustomerValidation, email)

  const customer = await prismaClient.customer.findUnique({
    where: {
      email,
    },
    select: {
      token: true,
      email: true,
      name: true,
      phoneNumber: true,
      photo: true,
      lat: true,
      long: true,
    },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer tidak dapat ditemukan', email)
  }

  return customer
}

async function update(requestData, requestFiles) {
  const updateRequest = validate(updateCustomerValidation, requestData)

  const customer = await prismaClient.customer.findUnique({
    where: {
      email: updateRequest.email,
    },
  })

  if (!customer) {
    throw new ResponseError(
      404,
      'Customer tidak dapat ditemukan',
      updateRequest.email,
    )
  }

  const updatedCustomerData = {
    name: updateRequest.name,
    phoneNumber: updateRequest.phoneNumber,
  }

  if (requestFiles) {
    const dateTime = giveCurrentDateTime()

    const storageRef = ref(
      storage,
      `customer_profiles/${`${requestFiles.originalname} ${dateTime}`}`,
    )

    const metadata = {
      contentType: 'image/jpeg',
    }

    // Upload the file to Firebase Storage
    const snapshot = await uploadBytesResumable(
      storageRef,
      requestFiles.buffer,
      metadata,
    )

    const imageURL = await getDownloadURL(snapshot.ref)

    updatedCustomerData.photo = imageURL
  }

  const updatedCustomer = await prismaClient.customer.update({
    where: {
      email: customer.email,
    },
    data: updatedCustomerData,
    select: {
      email: true,
    },
  })

  return updatedCustomer
}

function giveCurrentDateTime() {
  const today = new Date()
  const date
    = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  const time
    = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`
  const dateTime = `${date} ${time}`
  return dateTime
}

async function changePassword(email, request) {
  const changePasswordRequest = validate(
    changePasswordCustomerValidation,
    request,
  )

  const customer = await prismaClient.customer.findUnique({
    where: {
      email,
    },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer tidak ditemukan', email)
  }

  const isOldPasswordValid = await bcrypt.compare(
    changePasswordRequest.oldPassword,
    customer.password,
  )

  if (!isOldPasswordValid) {
    throw new ResponseError(401, 'Password lama tidak valid', customer.email)
  }

  const newPasswordHash = await bcrypt.hash(
    changePasswordRequest.newPassword,
    10,
  )

  const changePassword = await prismaClient.customer.update({
    where: {
      email: customer.email,
    },
    data: {
      password: newPasswordHash,
    },
  })

  return changePassword
}

async function updateLocation(email, requestData) {
  const updateLocationRequest = validate(
    updateLocationCustomerValidation,
    requestData,
  )

  const customer = await prismaClient.customer.findUnique({
    where: {
      email,
    },
  })

  if (!customer) {
    throw new ResponseError(
      404,
      'Customer tidak dapat ditemukan',
      email,
    )
  }

  const data = {
    lat: updateLocationRequest.latitude,
    long: updateLocationRequest.longitude,
  }
  const updatedCustomer = await prismaClient.customer.update({
    where: {
      email: customer.email,
    },
    data,
    select: {
      email: true,
    },
  })

  return updatedCustomer
}

async function updateDeviceToken(email, requestData) {
  const updateDeviceTokenRequest = validate(
    updateDeviceTokenCustomerValidation,
    requestData,
  )

  const customer = await prismaClient.customer.findUnique({
    where: {
      email,
    },
  })

  if (!customer) {
    throw new ResponseError(
      404,
      'Customer tidak dapat ditemukan',
      updateDeviceTokenRequest.email,
    )
  }

  const data = {
    deviceToken: updateDeviceTokenRequest.deviceToken,
  }
  const updatedCustomer = await prismaClient.customer.update({
    where: {
      email: customer.email,
    },
    data,
    select: {
      deviceToken: true,
    },
  })

  return updatedCustomer
}

async function logout(email) {
  email = validate(getCustomerValidation, email)

  const customer = await prismaClient.customer.findUnique({
    where: {
      email,
    },
  })

  if (!customer) {
    throw new ResponseError(404, 'customer is not found')
  }

  return prismaClient.customer.update({
    where: {
      email,
    },
    data: {
      token: null,
    },
    // select: {
    //   email: true,
    // },
  })
}

export default {
  register,
  resendOTPEmailRegister,
  verificationEmailRegister,
  login,
  checkAuthentication,
  forgotPassword,
  verificationEmailForgotPassword,
  resendOTPEmailForgotPassword,
  resetPassword,
  get,
  update,
  changePassword,
  updateLocation,
  updateDeviceToken,
  logout,
}
