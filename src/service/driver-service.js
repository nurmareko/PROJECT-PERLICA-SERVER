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
import { sendOTPForgotPasswordDriverByEmail } from '../utils/sendEmailForgotPassword.js'
import { sendOTPRegisterDriverByEmail } from '../utils/sendEmailRegister.js'
import {
  changePasswordDriverValidation,
  checkAuthenticationDriverValidation,
  forgotPasswordDriverValidation,
  getDriverValidation,
  loginDriverValidation,
  registerDriverValidation,
  resendOTPEmailForgotPasswordDriverValidation,
  resendOTPEmailRegisterDriverValidation,
  resetPasswordDriverValidation,
  updateDeviceTokenDriverValidation,
  updateDriverValidation,
  updateLocationDriverValidation,
  verificationEmailForgotPasswordDriverValidation,
  verificationEmailRegisterDriverValidation,
} from '../validation/driver-validation.js'
import { validate } from '../validation/validation.js'

async function register(request) {
  const driver = validate(registerDriverValidation, request)

  const countDriver = await prismaClient.driver.count({
    where: {
      email: driver.email,
    },
  })

  const driverDatabase = await prismaClient.driver.findUnique({
    where: {
      email: driver.email,
    },
  })

  if (countDriver === 1) {
    if (driverDatabase.verifiedEmail) {
      throw new ResponseError(400, 'registered', driver.email)
    }

    throw new ResponseError(400, 'unverified', driver.email)

    // return {
    //   status:'error',
    //   info: 'unverified-email',
    //   email: driver.email
    // }
  }

  const bcryptSaltRounds = 10
  driver.password = await bcrypt.hash(driver.password, bcryptSaltRounds)

  driver.photo = process.env.FALLBACK_DRIVER_AVATAR_URL || null

  const otp = Math.floor(1000 + Math.random() * 9000).toString()
  driver.otp = otp

  const expirationTime = new Date(Date.now() + 60_000).toISOString()
  driver.otpExpiry = expirationTime

  driver.verifiedEmail = false
  driver.status = false

  // Kirim OTP via email
  try {
    await sendOTPRegisterDriverByEmail(driver.email, otp, driver.name)
    logger.info('Email sent successfully.')
  }
  catch (error) {
    console.error('Error sending email:', error)
    throw new ResponseError(500, 'Internal Server Error')
  }

  return prismaClient.driver.create({
    data: driver,
    select: {
      // id: true,
      email: true,
    },
  })
}

async function resendOTPEmailRegister(request) {
  const { email } = validate(resendOTPEmailRegisterDriverValidation, request)

  const existingDriver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
  })

  if (!existingDriver) {
    throw new ResponseError(404, 'Driver tidak ditemukan', email)
  }

  if (existingDriver.verifiedEmail) {
    throw new ResponseError(400, 'Email sudah diverifikasi', email)
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString()
  const expirationTime = new Date(Date.now() + 60_000).toISOString()

  try {
    await sendOTPRegisterDriverByEmail(email, otp, existingDriver.name)
    logger.info('Email sent successfully.')
  }
  catch (error) {
    console.error('Error sending email:', error)
    throw new ResponseError(500, 'Internal Server Error')
  }

  return await prismaClient.driver.update({
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
    verificationEmailRegisterDriverValidation,
    request,
  )

  const existingDriver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
  })

  if (!existingDriver) {
    throw new ResponseError(404, 'Driver tidak ditemukan', email)
  }

  if (
    existingDriver.otp !== otp
    || new Date(existingDriver.otpExpiry ?? NaN).getTime() < Date.now()
  ) {
    throw new ResponseError(
      400,
      'Kode OTP tidak valid atau telah kadaluarsa',
      existingDriver.email,
    )
  }

  return await prismaClient.driver.update({
    where: {
      email,
    },
    data: {
      otp: null,
      otpExpiry: null,
      verifiedEmail: true,
    },
    select: {
      email: true,
    },
  })
}

async function forgotPassword(request) {
  const { email } = validate(forgotPasswordDriverValidation, request)

  const existingDriver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
  })

  if (!existingDriver) {
    throw new ResponseError(404, 'Driver tidak ditemukan', email)
  }

  if (!existingDriver.verifiedEmail) {
    throw new ResponseError(404, 'Driver tidak ditemukan', email)
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString()
  const expirationTime = new Date(Date.now() + 60_000).toISOString()

  try {
    await sendOTPForgotPasswordDriverByEmail(email, otp, existingDriver.name)
    logger.info('Email sent successfully.')
  }
  catch (error) {
    console.error('Error sending email:', error)
    throw new ResponseError(500, 'Internal Server Error')
  }

  return await prismaClient.driver.update({
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
    resendOTPEmailForgotPasswordDriverValidation,
    request,
  )

  const existingDriver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
  })

  if (!existingDriver) {
    throw new ResponseError(404, 'Driver tidak ditemukan', email)
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString()
  const expirationTime = new Date(Date.now() + 60_000).toISOString()

  try {
    await sendOTPForgotPasswordDriverByEmail(email, otp, existingDriver.name)
    logger.info('Email sent successfully.')
  }
  catch (error) {
    console.error('Error sending email:', error)
    throw new ResponseError(500, 'Internal Server Error')
  }

  return await prismaClient.driver.update({
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
    verificationEmailForgotPasswordDriverValidation,
    request,
  )

  const existingDriver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
  })

  if (!existingDriver) {
    throw new ResponseError(404, 'Driver tidak ditemukan', email)
  }

  if (
    existingDriver.otp !== otp
    || new Date(existingDriver.otpExpiry ?? NaN).getTime() < Date.now()
  ) {
    throw new ResponseError(
      400,
      'Kode OTP tidak valid atau telah kadaluarsa',
      existingDriver.email,
    )
  }

  return await prismaClient.driver.update({
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
  const driver = validate(resetPasswordDriverValidation, request)

  const driverDatabase = await prismaClient.driver.findUnique({
    where: {
      email: driver.email,
    },
  })

  if (!driverDatabase || !driverDatabase.verifiedEmail) {
    throw new ResponseError(400, 'Driver tidak dapat ditemukan', driver.email)
  }

  const bcryptSaltRounds = 10
  driver.password = await bcrypt.hash(driver.password, bcryptSaltRounds)

  return prismaClient.driver.update({
    where: {
      email: driver.email,
    },
    data: {
      password: driver.password,
    },
    select: {
      email: true,
    },
  })
}

async function login(request) {
  const loginRequest = validate(loginDriverValidation, request)

  const driver = await prismaClient.driver.findUnique({
    where: {
      email: loginRequest.email,
    },
  })

  if (!driver) {
    throw new ResponseError(401, 'Kredensial tidak valid', loginRequest.email)
  }

  if (driver.verifiedEmail) {
    const isPasswordValid = await bcrypt.compare(
      loginRequest.password,
      driver.password,
    )

    if (!isPasswordValid) {
      throw new ResponseError(
        401,
        'Kredensial tidak valid',
        loginRequest.email,
      )
    }
    if (!driver.status) {
      throw new ResponseError(401, 'Akun Anda dinonaktifkan', loginRequest.email)
    }
    const token = uuid().toString()
    const tokenExpiry = new Date()
    tokenExpiry.setDate(tokenExpiry.getDate() + 1)

    return prismaClient.driver.update({
      data: {
        token,
        tokenExpiry,
      },
      where: {
        email: driver.email,
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
  email = validate(checkAuthenticationDriverValidation, email)

  const driver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
    select: {
      token: true,
    },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver tidak dapat ditemukan', email)
  }

  return driver
}

async function get(email) {
  email = validate(getDriverValidation, email)

  const driver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
    select: {
      token: true,
      email: true,
      name: true,
      noMembership: true,
      licensePlate: true,
      phoneNumber: true,
      photo: true,
      lat: true,
      long: true,
    },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver tidak dapat ditemukan', email)
  }

  return driver
}

async function update(requestData, requestFiles) {
  const updateRequest = validate(updateDriverValidation, requestData)

  const driver = await prismaClient.driver.findUnique({
    where: {
      email: updateRequest.email,
    },
  })

  if (!driver) {
    throw new ResponseError(
      404,
      'Driver tidak dapat ditemukan',
      updateRequest.email,
    )
  }

  const updatedDriverData = {
    noMembership: updateRequest.noMembership,
    licensePlate: updateRequest.licensePlate,
    name: updateRequest.name,
    phoneNumber: updateRequest.phoneNumber,
  }

  if (requestFiles) {
    const dateTime = giveCurrentDateTime()

    const storageRef = ref(
      storage,
      `driver_profiles/${`${requestFiles.originalname} ${dateTime}`}`,
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

    updatedDriverData.photo = imageURL
  }

  const updatedDriver = await prismaClient.driver.update({
    where: {
      email: driver.email,
    },
    data: updatedDriverData,
    select: {
      email: true,
    },
  })

  return updatedDriver
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

async function updateLocation(email, requestData) {
  const updateLocationRequest = validate(
    updateLocationDriverValidation,
    requestData,
  )

  const driver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
  })

  if (!driver) {
    throw new ResponseError(
      404,
      'Driver tidak dapat ditemukan',
      email,
    )
  }

  const data = {
    lat: updateLocationRequest.latitude,
    long: updateLocationRequest.longitude,
  }
  const updatedDriver = await prismaClient.driver.update({
    where: {
      email: driver.email,
    },
    data,
    select: {
      email: true,
    },
  })

  return updatedDriver
}

async function updateDeviceToken(email, requestData) {
  const updateDeviceTokenRequest = validate(
    updateDeviceTokenDriverValidation,
    requestData,
  )

  const driver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
  })

  if (!driver) {
    throw new ResponseError(
      404,
      'Driver tidak dapat ditemukan',
      updateDeviceTokenRequest.email,
    )
  }

  const data = {
    deviceToken: updateDeviceTokenRequest.deviceToken,
  }
  const updatedDriver = await prismaClient.driver.update({
    where: {
      email: driver.email,
    },
    data,
    select: {
      deviceToken: true,
    },
  })

  return updatedDriver
}

async function changePassword(email, request) {
  const changePasswordRequest = validate(
    changePasswordDriverValidation,
    request,
  )

  const driver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver tidak ditemukan', email)
  }

  const isOldPasswordValid = await bcrypt.compare(
    changePasswordRequest.oldPassword,
    driver.password,
  )

  if (!isOldPasswordValid) {
    throw new ResponseError(401, 'Password lama tidak valid', driver.email)
  }

  const newPasswordHash = await bcrypt.hash(
    changePasswordRequest.newPassword,
    10,
  )

  const updatedDriver = await prismaClient.driver.update({
    where: {
      email: driver.email,
    },
    data: {
      password: newPasswordHash,
    },
  })

  return updatedDriver
}

async function logout(email) {
  email = validate(getDriverValidation, email)

  const driver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver tidak ditemukan')
  }

  return prismaClient.driver.update({
    where: {
      email,
    },
    data: {
      token: null,
    },
  })
}

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
