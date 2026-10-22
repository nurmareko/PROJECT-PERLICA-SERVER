import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { prismaClient } from '../src/application/database.js'
import customerService from '../src/service/customer-service.js'
import driverService from '../src/service/driver-service.js'
import orderService from '../src/service/order-service.js'

vi.mock('../src/application/database.js', () => ({
  prismaClient: {
    customer: { findUnique: vi.fn(), update: vi.fn() },
    driver: { findUnique: vi.fn(), update: vi.fn() },
    order: { findMany: vi.fn(), findUnique: vi.fn() },
    ride: { findUnique: vi.fn() },
    airport: { findFirst: vi.fn() },
  },
}))
vi.mock('../src/application/logging.js', () => ({ logger: { info: vi.fn(), error: vi.fn() } }))
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
vi.mock('../src/utils/sendEmailForgotPassword.js', () => ({
  sendOTPForgotPasswordCustomerByEmail: vi.fn(),
  sendOTPForgotPasswordDriverByEmail: vi.fn(),
}))
vi.mock('../src/utils/sendEmailReport.js', () => ({ sendCustomerReportEmail: vi.fn() }))
vi.mock('../src/utils/sendPushNotification.js', () => ({ default: vi.fn() }))

const email = 'person@example.com'

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe.each([
  ['customer', customerService],
  ['driver', driverService],
])('%s service', (model, service) => {
  it('returns the intended 404 and email for a missing location owner', async () => {
    prismaClient[model].findUnique.mockResolvedValue(null)
    await expect(service.updateLocation(email, { latitude: 1, longitude: 2 })).rejects.toMatchObject({
      name: 'ResponseError',
      status: 404,
      additionalData: email,
    })
    expect(prismaClient[model].update).not.toHaveBeenCalled()
  })

  describe.each(['verificationEmailRegister', 'verificationEmailForgotPassword'])('%s OTP contract', (method) => {
    beforeEach(() => {
      prismaClient[model].findUnique.mockResolvedValue({
        email,
        otp: '0123',
        otpExpiry: new Date(Date.now() + 60_000),
      })
      prismaClient[model].update.mockResolvedValue({ email })
    })

    it('accepts matching four-digit strings including leading zeroes', async () => {
      await expect(service[method]({ email, otp: '0123' })).resolves.toEqual({ email })
      expect(prismaClient[model].update).toHaveBeenCalledWith(expect.objectContaining({
        where: { email },
        data: expect.objectContaining({ otp: null, otpExpiry: null }),
      }))
    })

    it.each([1234, 123, '', '123', '12345', 'abcd', null])('rejects invalid input %j before database access', async (otp) => {
      await expect(service[method]({ email, otp })).rejects.toMatchObject({ status: 400 })
      expect(prismaClient[model].findUnique).not.toHaveBeenCalled()
      expect(prismaClient[model].update).not.toHaveBeenCalled()
    })

    it.each([
      ['mismatched', '9999', 60_000],
      ['expired', '0123', -1],
      ['cleared', null, 60_000],
    ])('rejects %s stored OTP without updating', async (_label, otp, expiryOffset) => {
      prismaClient[model].findUnique.mockResolvedValue({
        email,
        otp,
        otpExpiry: new Date(Date.now() + expiryOffset),
      })
      await expect(service[method]({ email, otp: '0123' })).rejects.toMatchObject({
        status: 400,
        message: 'Kode OTP tidak valid atau telah kadaluarsa',
      })
      expect(prismaClient[model].update).not.toHaveBeenCalled()
    })
  })
})

describe('order service', () => {
  it('returns the intended 404 and customer email for a missing report sender', async () => {
    prismaClient.customer.findUnique.mockResolvedValue(null)
    await expect(orderService.sendReport(email, 'order-1', 'report')).rejects.toMatchObject({
      name: 'ResponseError',
      status: 404,
      additionalData: email,
    })
    expect(prismaClient.order.findUnique).not.toHaveBeenCalled()
  })

  it.each([2, 3])('rejects rideStatus %i before further order processing', async (rideStatus) => {
    prismaClient.customer.findUnique.mockResolvedValue({ id: 1, email })
    prismaClient.order.findMany.mockResolvedValue([])
    prismaClient.ride.findUnique.mockResolvedValue({ id: 1, rideStatus })
    await expect(orderService.addOrder(email, { rideId: 1 })).rejects.toMatchObject({
      status: 400,
      message: 'Order cannot be completed',
    })
    expect(prismaClient.order.findMany).toHaveBeenCalledTimes(1)
    expect(prismaClient.airport.findFirst).not.toHaveBeenCalled()
  })

  it.each([0, 1])('allows rideStatus %i through to airport lookup', async (rideStatus) => {
    prismaClient.customer.findUnique.mockResolvedValue({ id: 1, email })
    prismaClient.order.findMany.mockResolvedValue([])
    prismaClient.ride.findUnique.mockResolvedValue({ id: 1, rideStatus })
    prismaClient.airport.findFirst.mockResolvedValue(null)
    await expect(orderService.addOrder(email, { rideId: 1 })).rejects.toMatchObject({
      status: 404,
      message: 'Airport not found',
    })
    expect(prismaClient.order.findMany).toHaveBeenCalledTimes(2)
    expect(prismaClient.airport.findFirst).toHaveBeenCalledOnce()
  })
})
