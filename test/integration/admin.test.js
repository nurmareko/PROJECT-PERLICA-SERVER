import supertest from 'supertest'
import { accounts, logger, tokens, web } from './harness.js'

// testing to login

describe('pOST /api/admin/login', () => {
  it('should can login', async () => {
    const result = await supertest(web).post('/api/admin/login').send({
      email: accounts.admin.email,
      password: accounts.credentials.password,
    })

    logger.info('Integration response', { status: result.status })

    expect(result.status).toBe(200)
    expect(result.body.data.token).toBeDefined()
    expect(result.body.data.token).not.toBe('test')
  })
})

// testing to get data admin

describe('gET /api/admin/getCurrent', () => {
  it('should can get data admin', async () => {
    const result = await supertest(web)
      .get('/api/admin/getCurrent')
      .set('Authorization', tokens.admin)

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing to get data driver

describe('gET /api/admin/getDriver', () => {
  it('should can get data driver', async () => {
    const result = await supertest(web)
      .get('/api/admin/getDriver')
      .set('Authorization', tokens.admin)

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing to get data customer

describe('gET /api/admin/getCustomer', () => {
  it('should can get data customer', async () => {
    const result = await supertest(web)
      .get('/api/admin/getCustomer')
      .set('Authorization', tokens.admin)

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing to get data fare

describe('gET /api/admin/getFare', () => {
  it('should can get data fare', async () => {
    const result = await supertest(web)
      .get('/api/admin/getFare')
      .set('Authorization', tokens.admin)

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing to update data fare

describe('pATCH /api/admin/updateFare', () => {
  it('should can get data fare', async () => {
    const result = await supertest(web)
      .patch('/api/admin/updateFare')
      .set('Authorization', tokens.admin)
      .send({
        fareId: accounts.fare.id,
        farePerKm: 16000,
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing to activate driver account

describe('pATCH /api/admin/activateDriverAccount', () => {
  it('should can activate driver account', async () => {
    const result = await supertest(web)
      .patch('/api/admin/activateDriverAccount')
      .set('Authorization', tokens.admin)
      .send({
        driverId: accounts.driver.id,
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing to deactivate driver account

describe('pATCH /api/admin/deactivateDriverAccount', () => {
  it('should can deactivate driver account', async () => {
    const result = await supertest(web)
      .patch('/api/admin/deactivateDriverAccount')
      .set('Authorization', tokens.admin)
      .send({
        driverId: accounts.driver.id,
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing to activate customer account

describe('pATCH /api/admin/activateCustomerAccount', () => {
  it('should can activate customer account', async () => {
    const result = await supertest(web)
      .patch('/api/admin/activateCustomerAccount')
      .set('Authorization', tokens.admin)
      .send({
        customerId: accounts.customer.id,
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing to deactivate customer account

describe('pATCH /api/admin/deactivateCustomerAccount', () => {
  it('should can deactivate customer account', async () => {
    const result = await supertest(web)
      .patch('/api/admin/deactivateCustomerAccount')
      .set('Authorization', tokens.admin)
      .send({
        customerId: accounts.customer.id,
      })

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing to get data orderan

describe('gET /api/admin/getOrderan', () => {
  it('should can get data orderan', async () => {
    const result = await supertest(web)
      .get('/api/admin/getOrderan')
      .set('Authorization', tokens.admin)

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing to get data ride

describe('gET /api/admin/getRide', () => {
  it('should can get data ride', async () => {
    const result = await supertest(web)
      .get('/api/admin/getRide')
      .set('Authorization', tokens.admin)

    logger.info('Integration response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// testing logout

describe('dELETE /api/admin/logout', () => {
  it('should can logout', async () => {
    const result = await supertest(web)
      .delete('/api/admin/logout')
      .set('Authorization', tokens.admin)

    expect(result.status).toBe(200)
    expect(result.body.data).toBe('OK')
  })
})
