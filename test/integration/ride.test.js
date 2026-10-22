import supertest from 'supertest'
import { logger, tokens, web } from './harness.js'

// get current ride

describe('gET /api/drivers/rides/getCurrentRide', () => {
  it('should can get current ride', async () => {
    const result = await supertest(web)
      .get('/api/drivers/rides/getCurrentRide')
      .set('Authorization', tokens.driver)

    logger.info('GET /api/drivers/rides/getCurrentRide response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// add new ride
describe('pOST /api/drivers/rides/addRide', () => {
  it('should can add new ride', async () => {
    const result = await supertest(web)
      .post('/api/drivers/rides/addRide')
      .set('Authorization', tokens.driver)
      .send({
        lat: -0.038002,
        long: 109.310296,
        pickupRadius: 3000,
      })

    logger.info('POST /api/drivers/rides/addRide response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// cancel ride

describe('pATCH /api/drivers/rides/cancelRide', () => {
  it('should can cancel ride', async () => {
    const result = await supertest(web)
      .patch('/api/drivers/rides/cancelRide')
      .set('Authorization', tokens.driver)
      .send({
        rideId: 'RID-000003',
      })

    logger.info('PATCH /api/drivers/rides/cancelRide response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// complete ride

describe('pATCH /api/drivers/rides/completeRide', () => {
  it('should can complete ride', async () => {
    const result = await supertest(web)
      .patch('/api/drivers/rides/completeRide')
      .set('Authorization', tokens.driver)
      .send({
        rideId: 'RID-000003',
      })

    logger.info('PATCH /api/drivers/rides/completeRide response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// complete and close ride

describe('pATCH /api/drivers/rides/completeAndCloseRide', () => {
  it('should can complete ride', async () => {
    const result = await supertest(web)
      .patch('/api/drivers/rides/completeAndCloseRide')
      .set('Authorization', tokens.driver)
      .send({
        rideId: 'RID-000001',
      })

    logger.info('PATCH /api/drivers/rides/completeAndCloseRide response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// get history ride

describe('gET /api/drivers/rides/getHistoryRide', () => {
  it('should can get history ride', async () => {
    const result = await supertest(web)
      .get('/api/drivers/rides/getHistoryRide')
      .set('Authorization', tokens.driver)

    logger.info('GET /api/drivers/rides/getHistoryRide response', { status: result.status })
    expect(result.status).toBe(200)
  })
})
