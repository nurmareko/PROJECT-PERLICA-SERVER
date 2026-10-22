import supertest from 'supertest'
import { logger, tokens, web } from './harness.js'

// testing to register customer
describe('pOST /api/customers', () => {
  it('should can register new customer', async () => {
    const result = await supertest(web).post('/api/customers').send({
      email: 'customer-fixture-2@example.test',
      name: 'Example Customer',
      phoneNumber: '+12025550101',
      password: 'ExamplePassword2!',
    })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.email).toBe('customer-fixture-3@example.test')
    expect(result.body.data.password).toBeUndefined()
  })

  it('should reject the registration if the email is already registered (email verified)', async () => {
    const result = await supertest(web).post('/api/customers').send({
      email: 'customer-fixture-4@example.test',
      name: 'Example Customer',
      phoneNumber: '+12025550101',
      password: 'ExamplePassword2!',
    })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(400)
    // expect(result.body.errors).toBeDefined();
  })

  it('registration if the email is already registered (email not verified)', async () => {
    const result = await supertest(web).post('/api/customers').send({
      email: 'customer-fixture-3@example.test',
      name: 'Example Customer',
      phoneNumber: '+12025550101',
      password: 'ExamplePassword2!',
    })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(400)
    expect(result.body.errors).toBeUndefined()
  })
})

// testing to verify email with OTP
describe('pOST /api/customers/verificationEmailRegister', () => {
  it('should can verify email using OTP', async () => {
    const result = await supertest(web)
      .post('/api/customers/verificationEmailRegister')
      .send({
        email: 'customer-fixture-3@example.test',
        otp: '4365',
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.email).toBe('customer-fixture-3@example.test')
  })
})

// testing to resend OTP

describe('pOST /api/customers/resendOTPEmailRegister', () => {
  it('should can resend OTP', async () => {
    const result = await supertest(web)
      .post('/api/customers/resendOTPEmailRegister')
      .send({
        email: 'customer-fixture-3@example.test',
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.email).toBe('customer-fixture-3@example.test')
  })
})

// testing to login

describe('pOST /api/customers/login', () => {
  // beforeEach(async () => {
  //   await createTestCustomer();
  // });

  // afterEach(async () => {
  //   await removeTestCustomer();
  // });

  it('should can login', async () => {
    const result = await supertest(web).post('/api/customers/login').send({
      email: 'customer-fixture-3@example.test',
      password: 'ExamplePassword2!',
    })

    logger.info('Integration response', { status: result.status })

    expect(result.status).toBe(200)
    expect(result.body.data.token).toBeDefined()
    expect(result.body.data.token).not.toBe('test')
  })

  it('should cant login (email not verified)', async () => {
    const result = await supertest(web).post('/api/customers/login').send({
      email: 'customer-fixture-4@example.test',
      password: 'ExamplePassword2!',
    })

    logger.info('Integration response', { status: result.status })

    expect(result.status).toBe(401)
    expect(result.body.errors).toBeDefined()
  })

  // if email already verified

  it('should reject login if request is invalid', async () => {
    const result = await supertest(web).post('/api/customers/login').send({
      email: '',
      password: '',
    })

    logger.info('Integration response', { status: result.status })

    expect(result.status).toBe(400)
    expect(result.body.errors).toBeDefined()
  })

  it('should reject login if email is wrong', async () => {
    const result = await supertest(web).post('/api/customers/login').send({
      email: 'customer-fixture-5@example.test',
      password: 'ExamplePassword2!',
    })

    logger.info('Integration response', { status: result.status })

    expect(result.status).toBe(401)
    expect(result.body.errors).toBeDefined()
  })

  it('should reject login if password is wrong', async () => {
    const result = await supertest(web).post('/api/customers/login').send({
      email: 'customer-fixture-4@example.test',
      password: 'ExamplePassword3!',
    })

    logger.info('Integration response', { status: result.status })

    expect(result.status).toBe(401)
    expect(result.body.errors).toBeDefined()
  })
})

// testing check authentication

describe('gET /api/customers/checkAuthentication', () => {
  it('should can check authentication', async () => {
    const result = await supertest(web)
      .get('/api/customers/checkAuthentication')
      .set('Authorization', tokens.customer)

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
    expect(result.body.data.token).toBeDefined()
    expect(result.body.data.token).not.toBe('test')
  })
})

// testing get data customer

describe('gET /api/customers/current', () => {
  it('should can get current customer', async () => {
    const result = await supertest(web)
      .get('/api/customers/current')
      .set('Authorization', tokens.customer)

    expect(result.status).toBe(200)
    expect(result.body.data.email).toBe('customer-fixture-4@example.test')
    expect(result.body.data.name).toBe('Example Customer')
  })

  it('should reject if token is invalid', async () => {
    const result = await supertest(web)
      .get('/api/customers/current')
      .set('Authorization', 'salah')

    expect(result.status).toBe(401)
    expect(result.body.errors).toBeDefined()
  })
})

// testing to update customer data

// update location

describe('pATCH /api/customers/updateLocation', () => {
  it('should can update location', async () => {
    const result = await supertest(web)
      .patch('/api/customers/updateLocation')
      .set('Authorization', tokens.customer)
      .send({
        latitude: -0.05502,
        longitude: 109.31273,
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// update device token

describe('pATCH /api/customers/updateDeviceToken', () => {
  it('should can update location', async () => {
    const result = await supertest(web)
      .patch('/api/customers/updateDeviceToken')
      .set('Authorization', tokens.customer)
      .send({
        deviceToken: 'fictional-device-token-not-for-delivery',
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing logout

describe('dELETE /api/customers/logout', () => {
  it('should can logout', async () => {
    const result = await supertest(web)
      .delete('/api/customers/logout')
      .set('Authorization', tokens.customer)

    expect(result.status).toBe(200)
    expect(result.body.data).toBe('OK')
  })

  it('should reject logout if token is invalid', async () => {
    const result = await supertest(web)
      .delete('/api/customers/logout')
      .set('Authorization', 'token-salah')

    expect(result.status).toBe(401)
  })
})
