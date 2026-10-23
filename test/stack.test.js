import axios from 'axios'
import bcrypt from 'bcryptjs'
import supertest from 'supertest'
import { v4 as uuid, validate as validateUuid } from 'uuid'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

// These checks must never send notifications or use a real database.
vi.mock('../src/utils/sendPushNotification.js', () => ({ default: vi.fn() }))
vi.mock('dotenv/config', () => ({}))
vi.mock('dotenv', () => ({ default: { config: () => ({ parsed: {} }) } }))
vi.mock('firebase/app', () => ({ initializeApp: vi.fn() }))
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  getDownloadURL: vi.fn(),
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(),
}))
vi.mock('axios', () => ({ default: { get: vi.fn() } }))
vi.mock('../src/utils/sendEmailRegister.js', () => ({
  sendOTPRegisterCustomerByEmail: vi.fn(),
  sendOTPRegisterDriverByEmail: vi.fn(),
}))

let web
let prismaClient

beforeAll(async () => {
  vi.stubEnv('DATABASE_URL', 'mysql://test:test@127.0.0.1:1/stack_test');
  ({ web } = await import('../src/application/web.js'));
  ({ prismaClient } = await import('../src/application/database.js'))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

afterAll(async () => {
  await prismaClient?.$disconnect()
  vi.unstubAllEnvs()
})

describe('external service configuration', () => {
  it.each([undefined, '', '   '])('rejects Maps calls without a configured key (%j)', async (key) => {
    vi.stubEnv('GOOGLE_MAPS_API_KEY', key)
    const { default: orderService } = await import('../src/service/order-service.js')
    vi.spyOn(prismaClient.customer, 'findUnique').mockResolvedValue({ lat: 1, long: 2 })
    vi.spyOn(prismaClient.airport, 'findFirst').mockResolvedValue({ lat: 3, long: 4 })

    await expect(orderService.getTaxisWithinRadius('customer@example.com')).rejects.toMatchObject({
      status: 503,
      message: 'Maps service is not configured',
    })
    expect(axios.get).not.toHaveBeenCalled()
  })

  it('uses the configured Maps key and does not log request errors', async () => {
    vi.stubEnv('GOOGLE_MAPS_API_KEY', 'test-maps-key')
    const { default: orderService } = await import('../src/service/order-service.js')
    vi.spyOn(prismaClient.customer, 'findUnique').mockResolvedValue({ lat: 1, long: 2 })
    vi.spyOn(prismaClient.airport, 'findFirst').mockResolvedValue({ lat: 3, long: 4 })
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    axios.get.mockRejectedValue(new Error('request containing test-maps-key'))

    await expect(orderService.getTaxisWithinRadius('customer@example.com')).rejects.toMatchObject({
      status: 500,
      message: 'Failed to fetch directions data',
    })
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('key=test-maps-key'))
    expect(JSON.stringify(log.mock.calls)).not.toContain('test-maps-key')
  })

  describe.each(['customer', 'driver'])('%s default photo', (model) => {
    it.each([undefined, '', 'https://example.com/default.png'])('uses the optional photo URL or null (%j)', async (photo) => {
      vi.stubEnv(`FALLBACK_${model.toUpperCase()}_AVATAR_URL`, photo)
      const { default: service } = await import(`../src/service/${model}-service.js`)
      vi.spyOn(prismaClient[model], 'count').mockResolvedValue(0)
      vi.spyOn(prismaClient[model], 'findUnique').mockResolvedValue(null)
      const create = vi.spyOn(prismaClient[model], 'create').mockResolvedValue({ email: 'person@example.com' })
      const request = {
        email: 'person@example.com',
        name: 'Test Person',
        phoneNumber: '1234567890',
        password: 'test-password',
        ...(model === 'driver' ? { noMembership: 'test-member', licensePlate: 'test-plate' } : {}),
      }

      await expect(service.register(request)).resolves.toEqual({ email: request.email })
      expect(create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ photo: photo || null }),
      }))
    })
  })
})

describe('upgraded server stack', () => {
  it('constructs the generated Prisma client with the MySQL adapter', () => {
    expect(prismaClient.customer.findFirst).toBeTypeOf('function')
    expect(prismaClient.driver.findFirst).toBeTypeOf('function')
  })

  it.each(['customers', 'drivers', 'admin'])(
    'rejects unauthenticated %s requests without accessing the database',
    async (role) => {
      const result = await supertest(web).get(`/api/${role}/current`)
      expect(result.status).toBe(401)
      expect(result.body.error.message).toBe('Unauthorized')
    },
  )

  it.each(['customers', 'drivers'])(
    'preserves Joi validation for invalid %s registrations',
    async (role) => {
      const result = await supertest(web).post(`/api/${role}`).send({})
      expect(result.status).toBe(400)
    },
  )

  it('preserves CORS preflight handling', async () => {
    const result = await supertest(web)
      .options('/api/customers')
      .set('Origin', 'https://example.com')
      .set('Access-Control-Request-Method', 'POST')
    expect(result.status).toBe(204)
    expect(result.headers['access-control-allow-origin']).toBe('*')
  })

  it('keeps bcrypt password hashes compatible', async () => {
    const hash = await bcrypt.hash('migration-test', 4)
    expect(await bcrypt.compare('migration-test', hash)).toBe(true)
    expect(await bcrypt.compare('wrong-password', hash)).toBe(false)
  })

  it('loads the ESM-only UUID dependency', () => {
    expect(validateUuid(uuid())).toBe(true)
  })
})
