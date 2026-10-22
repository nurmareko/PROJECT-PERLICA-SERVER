import supertest from 'supertest'
import { logger, tokens, web } from './harness.js'

// customer

// getting taxis within radius
describe('gET /api/customers/orders/getTaxisWithinRadius', () => {
  it('should can get taxis within radius', async () => {
    const result = await supertest(web)
      .get('/api/customers/orders/getTaxisWithinRadius')
      .set('Authorization', tokens.customer)

    logger.info('GET /api/customers/orders/getTaxisWithinRadius response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// get current order
describe('gET /api/customers/orders/getCurrentOrder', () => {
  it('should can get current taxi', async () => {
    const result = await supertest(web)
      .get('/api/customers/orders/getCurrentOrder')
      .set('Authorization', tokens.customer)

    logger.info('GET /api/customers/orders/getCurrentOrder response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// oder taxi
describe('pOST /api/customers/orders/addOrder', () => {
  it('customer should can make order', async () => {
    const result = await supertest(web)
      .post('/api/customers/orders/addOrder')
      .set('Authorization', tokens.customer)
      .send({
        rideId: 'RID-000019',
        latitude: -0.05482,
        longitude: 109.31304,
      })

    logger.info('POST /api/customers/orders/addOrder response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// cancel order

describe('pATCH /api/customers/orders/cancelOrder', () => {
  it('customer should can cancel order', async () => {
    const result = await supertest(web)
      .patch('/api/customers/orders/cancelOrder')
      .set('Authorization', tokens.customer)
      .send({
        orderId: 1,
      })

    logger.info('PATCH /api/customers/orders/cancelOrder response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// get history order
describe('gET /api/customers/orders/getHistoryOrder', () => {
  it('should can get history order taxi', async () => {
    const result = await supertest(web)
      .get('/api/customers/orders/getHistoryOrder')
      .set('Authorization', tokens.customer)

    logger.info('GET /api/customers/orders/getHistoryOrder response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// send message

describe('pOST /api/customers/orders/sendMessage', () => {
  it('should can send message by customer', async () => {
    const result = await supertest(web)
      .post('/api/customers/orders/sendMessage')
      .set('Authorization', tokens.customer)
      .send({
        orderId: 1,
        message:
          'halo kak, maaf saya batalkan soalnya nenek dari tetangganya sepupu dari anak tetanggga saya lahiran kak, maaf.',
      })

    logger.info('POST /api/customers/orders/sendMessage response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// send report

describe('pOST /api/customers/orders/sendReport', () => {
  it('should can send message by customer', async () => {
    const result = await supertest(web)
      .post('/api/customers/orders/sendReport')
      .set('Authorization', tokens.customer)
      .send({
        orderId: 2,
        message:
          'halo kak, maaf saya batalkan soalnya nenek dari tetangganya sepupu dari anak tetanggga saya lahiran kak, maaf.',
      })

    logger.info('POST /api/customers/orders/sendReport response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// send review

describe('pATCH /api/customers/orders/sendReview', () => {
  it('should can send message by customer', async () => {
    const result = await supertest(web)
      .patch('/api/customers/orders/sendReview')
      .set('Authorization', tokens.customer)
      .send({
        orderId: 2,
        rating: 5,
        review: 'Ramah, tamah, dan suka berbagi, i love u ',
      })

    logger.info('PATCH /api/customers/orders/sendReview response', { status: result.status })
    expect(result.status).toBe(200)
  })
})
