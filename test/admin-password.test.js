import bcrypt from 'bcryptjs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { prismaClient } from '../src/application/database.js'
import adminService from '../src/service/admin-service.js'

vi.mock('../src/application/database.js', () => ({
  prismaClient: { admin: { findUnique: vi.fn(), update: vi.fn() } },
}))
vi.mock('../src/utils/sendEmailAccountStatus.js', () => ({
  sendCustomerAccountActivationEmail: vi.fn(),
  sendCustomerAccountDeactivationEmail: vi.fn(),
  sendDriverAccountActivationEmail: vi.fn(),
  sendDriverAccountDeactivationEmail: vi.fn(),
}))

const email = 'admin@example.com'
const password = 'Admin-test-password-123'
let hash

beforeAll(async () => {
  hash = await bcrypt.hash(password, 12)
})
beforeEach(() => vi.resetAllMocks())

describe('admin password verification', () => {
  it('accepts a bcrypt password and returns only the session token', async () => {
    prismaClient.admin.findUnique.mockResolvedValue({ email, password: hash })
    prismaClient.admin.update.mockResolvedValue({ token: 'session-token' })

    await expect(adminService.login({ email, password })).resolves.toEqual({ token: 'session-token' })
    expect(prismaClient.admin.update).toHaveBeenCalledWith({
      where: { email },
      data: { token: expect.any(String), tokenExpiry: expect.any(Date) },
      select: { token: true },
    })
  })

  it.each(['wrong-password', 'hash-as-password'])('rejects %s without creating a session', async (kind) => {
    prismaClient.admin.findUnique.mockResolvedValue({ email, password: hash })
    await expect(adminService.login({ email, password: kind === 'hash-as-password' ? hash : kind }))
      .rejects
      .toMatchObject({ status: 401, message: 'Kredensial tidak valid' })
    expect(prismaClient.admin.update).not.toHaveBeenCalled()
  })

  it('rejects legacy plaintext credentials even when the password matches', async () => {
    prismaClient.admin.findUnique.mockResolvedValue({ email, password })
    await expect(adminService.login({ email, password })).rejects.toMatchObject({ status: 401 })
    expect(prismaClient.admin.update).not.toHaveBeenCalled()
  })

  it('rejects an unknown account', async () => {
    prismaClient.admin.findUnique.mockResolvedValue(null)
    await expect(adminService.login({ email, password })).rejects.toMatchObject({ status: 401 })
    expect(prismaClient.admin.update).not.toHaveBeenCalled()
  })

  it('rejects input exceeding bcrypt byte limits rather than accepting a truncated match', async () => {
    const prefix = 'a'.repeat(72)
    prismaClient.admin.findUnique.mockResolvedValue({ email, password: await bcrypt.hash(prefix, 4) })
    await expect(adminService.login({ email, password: `${prefix}suffix` })).rejects.toMatchObject({ status: 401 })
    expect(prismaClient.admin.update).not.toHaveBeenCalled()
  })
})
