import supertest from 'supertest'
import { accounts, logger, tokens, web } from './harness.js'

// testing to register driver
describe('pOST /api/drivers', () => {
  it('should can register new driver', async () => {
    const result = await supertest(web).post('/api/drivers').send({
      email: 'driver-fixture-6@example.test',
      name: 'Example Driver',
      noMembership: 'member123',
      licensePlate: 'AB 1234 CD',
      phoneNumber: '+12025550102',
      password: 'ExamplePassword4!',
    })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.email).toBe('driver-fixture-6@example.test')
    expect(result.body.data.password).toBeUndefined()
  })
})

// testing to resend OTP

describe('pOST /api/drivers/resendOTPEmailRegister', () => {
  it('should can resend OTP email register', async () => {
    const result = await supertest(web)
      .post('/api/drivers/resendOTPEmailRegister')
      .send({
        email: 'driver-fixture-7@example.test',
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.email).toBe('driver-fixture-7@example.test')
  })
})

// testing to verify email with OTP
describe('pOST /api/drivers/verificationEmailRegister', () => {
  it('should can verify email register using OTP', async () => {
    const result = await supertest(web)
      .post('/api/drivers/verificationEmailRegister')
      .send({
        email: 'driver-fixture-6@example.test',
        otp: '9872',
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.email).toBe('driver-fixture-6@example.test')
  })
})

// testing to forgot password

describe('pOST /api/drivers/forgotPassword', () => {
  it('should can do forgot password', async () => {
    const result = await supertest(web)
      .post('/api/drivers/forgotPassword')
      .send({
        email: 'driver-fixture-7@example.test',
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.email).toBe('driver-fixture-7@example.test')
  })
})

// testing to resend OTP forgot password

describe('pOST /api/drivers/resendOTPEmailForgotPassword', () => {
  it('should can resend OTP email forgot password', async () => {
    const result = await supertest(web)
      .post('/api/drivers/resendOTPEmailForgotPassword')
      .send({
        email: 'driver-fixture-7@example.test',
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.email).toBe('driver-fixture-7@example.test')
  })
})

// testing to verification email forgot password

describe('pOST /api/drivers/verificationEmailForgotPassword', () => {
  it('should can verify email forgot password', async () => {
    const result = await supertest(web)
      .post('/api/drivers/verificationEmailForgotPassword')
      .send({
        email: 'driver-fixture-7@example.test',
        otp: '3993',
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.email).toBe('driver-fixture-7@example.test')
  })
})

// testing to verification email forgot password

describe('pATCH /api/drivers/resetPassword', () => {
  it('should can reset password', async () => {
    const result = await supertest(web)
      .patch('/api/drivers/resetPassword')
      .send({
        email: 'driver-fixture-7@example.test',
        password: 'ExamplePassword5!',
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.email).toBe('driver-fixture-7@example.test')
  })
})

// testing login

describe('pOST /api/drivers/login', () => {
  it('should can login', async () => {
    const result = await supertest(web).post('/api/drivers/login').send({
      email: accounts.driver.email,
      password: accounts.credentials.password,
    })

    logger.info('Integration response', { status: result.status })

    expect(result.status).toBe(200)
    expect(result.body.data.token).toBeDefined()
    expect(result.body.data.token).not.toBe('test')
  })
})

// check authentication

describe('gET /api/drivers/checkAuthentication', () => {
  it('should can check authentication', async () => {
    const result = await supertest(web)
      .get('/api/drivers/checkAuthentication')
      .set('Authorization', tokens.driver)

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.token).toBeDefined()
    expect(result.body.data.token).not.toBe('test')
  })
})

// testing get data

describe('gET /api/drivers/current', () => {
  it('should can check authentication', async () => {
    const result = await supertest(web)
      .get('/api/drivers/current')
      .set('Authorization', tokens.driver)

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.token).toBeDefined()
  })
})

// testing update driver data

// testing update driver location

describe('pATCH /api/drivers/updateLocation', () => {
  it('should can update location', async () => {
    const result = await supertest(web)
      .patch('/api/drivers/updateLocation')
      .set('Authorization', tokens.driver)
      .send({
        latitude: -0.038002,
        longitude: 109.310296,
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing change password

describe('pATCH /api/drivers/changePassword', () => {
  it('should can check authentication', async () => {
    const result = await supertest(web)
      .patch('/api/drivers/changePassword')
      .set('Authorization', tokens.driver)
      .send({
        oldPassword: accounts.credentials.password,
        newPassword: 'ExamplePassword6!',
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.token).toBeDefined()
  })
})

// update device token

describe('pATCH /api/drivers/updateDeviceToken', () => {
  it('should can update location', async () => {
    const result = await supertest(web)
      .patch('/api/drivers/updateDeviceToken')
      .set('Authorization', tokens.driver)
      .send({
        deviceToken: 'fictional-device-token-not-for-delivery',
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing logout

describe('dELETE /api/drivers/logout', () => {
  it('should can logout', async () => {
    const result = await supertest(web)
      .delete('/api/drivers/logout')
      .set('Authorization', tokens.driver)

    expect(result.status).toBe(200)
    expect(result.body.data).toBe('OK')
  })
})
