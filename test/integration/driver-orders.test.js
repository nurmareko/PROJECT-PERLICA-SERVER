import supertest from 'supertest'
import { logger, tokens, web } from './harness.js'

// orderan by driver

describe('gET /api/drivers/orders/getCurrentOrderan', () => {
  it('should can reject orderan by driver', async () => {
    const result = await supertest(web)
      .get('/api/drivers/orders/getCurrentOrderan')
      .set('Authorization', tokens.driver)

    logger.info('GET /api/drivers/orders/getCurrentOrderan response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// reject orderan
describe('pATCH /api/drivers/orders/rejectOrderan', () => {
  it('should can reject orderan by driver', async () => {
    const result = await supertest(web)
      .patch('/api/drivers/orders/rejectOrderan')
      .set('Authorization', tokens.driver)
      .send({
        orderId: 6,
      })

    logger.info('PATCH /api/drivers/orders/rejectOrderan response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// accept orderan

describe('pATCH /api/drivers/orders/acceptOrderan', () => {
  it('should can accept orderan by driver', async () => {
    const result = await supertest(web)
      .patch('/api/drivers/orders/acceptOrderan')
      .set('Authorization', tokens.driver)
      .send({
        orderId: 'ORD-000002',
      })

    logger.info('PATCH /api/drivers/orders/acceptOrderan response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// cancel orderan

describe('pATCH /api/drivers/orders/cancelOrderan', () => {
  it('should can cancel orderan by driver', async () => {
    const result = await supertest(web)
      .patch('/api/drivers/orders/cancelOrderan')
      .set('Authorization', tokens.driver)
      .send({
        orderId: 3,
      })

    logger.info('PATCH /api/drivers/orders/cancelOrderan response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// get history orderan

describe('gET /api/drivers/orders/getHistoryOrderan', () => {
  it('should can reject orderan by driver', async () => {
    const result = await supertest(web)
      .get('/api/drivers/orders/getHistoryOrderan')
      .set('Authorization', tokens.driver)

    logger.info('GET /api/drivers/orders/getHistoryOrderan response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// update status orderan

describe('pATCH /api/drivers/orders/updateStatusOrderan', () => {
  it('should can update status orderan by driver', async () => {
    const result = await supertest(web)
      .patch('/api/drivers/orders/updateStatusOrderan')
      .set('Authorization', tokens.driver)
      .send({
        orderId: 'ORD-000002',
        status: 2,
      })

    logger.info('PATCH /api/drivers/orders/updateStatusOrderan response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// update location orderan

describe('pATCH /api/drivers/orders/updateLocationOrderan', () => {
  it('should can update location orderan by driver', async () => {
    const result = await supertest(web)
      .patch('/api/drivers/orders/updateLocationOrderan')
      .set('Authorization', tokens.driver)
      .send({
        latitude: -0.050177,
        longitude: 109.337025,
      })

    logger.info('PATCH /api/drivers/orders/updateLocationOrderan response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// send message

describe('pOST /api/drivers/orders/sendMessage', () => {
  it('should can send message by driver', async () => {
    const result = await supertest(web)
      .post('/api/drivers/orders/sendMessage')
      .set('Authorization', tokens.driver)
      .send({
        orderId: 1,
        message:
          'halo Example Customer, saya batalkan ya soalnya ban saya bocor, bisa di coba untuk cari taksi yang lain ya kak, mohon maaf.',
      })

    logger.info('POST /api/drivers/orders/sendMessage response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// send report
describe('pOST /api/drivers/orders/sendReport', () => {
  it('should allow a driver to send report', async () => {
    const result = await supertest(web)
      .post('/api/drivers/orders/sendReport')
      .set('Authorization', tokens.driver)
      .send({
        orderId: 2,
        message:
          'halo kak, maaf saya batalkan soalnya nenek dari tetangganya sepupu dari anak tetanggga saya lahiran kak, maaf.',
      })

    logger.info('POST /api/drivers/orders/sendReport response', { status: result.status })
    expect(result.status).toBe(200)
  })
})

// send review

describe('pATCH /api/drivers/orders/sendReview', () => {
  it('should can send review by driver', async () => {
    const result = await supertest(web)
      .patch('/api/drivers/orders/sendReview')
      .set('Authorization', tokens.driver)
      .send({
        orderId: 2,
        rating: 5,
        review: 'Ramah, tamah, dan suka berbagi, i love u ',
      })

    logger.info('PATCH /api/drivers/orders/sendReview response', { status: result.status })
    expect(result.status).toBe(200)
  })
})
