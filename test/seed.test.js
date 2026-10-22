import bcrypt from 'bcryptjs'
import { describe, expect, it, vi } from 'vitest'
import { seedDevelopment } from '../prisma/seed.js'

const env = {
  NODE_ENV: 'development',
  ENABLE_DEV_SEEDING: 'true',
  DEV_SEED_PASSWORD: 'Only-for-seed-tests-123',
}

function createDatabase() {
  const tables = {}
  const tx = {}
  for (const name of ['admin', 'customer', 'driver', 'airport', 'fare']) {
    const rows = []
    tables[name] = rows
    tx[name] = {
      async upsert({ where, create }) {
        const existing = rows.find(row => row.email === where.email)
        if (existing)
          return existing
        const row = { id: rows.length + 1, ...create }
        rows.push(row)
        return row
      },
      async findFirst() {
        return rows[0] ?? null
      },
      async create({ data }) {
        const row = { id: rows.length + 1, ...data }
        rows.push(row)
        return row
      },
    }
  }
  return { tables, prisma: { $transaction: vi.fn(callback => callback(tx)) } }
}

describe('development seed', () => {
  it.each([
    { ...env, NODE_ENV: 'production' },
    { ...env, NODE_ENV: undefined },
    { ...env, ENABLE_DEV_SEEDING: undefined },
    { ...env, DEV_SEED_PASSWORD: '' },
    { ...env, DEV_SEED_PASSWORD: 'short' },
    { ...env, DEV_SEED_PASSWORD: 'a'.repeat(73) },
    { ...env, DEV_SEED_PASSWORD: 'é'.repeat(37) },
  ])('rejects unsafe configuration before database access %#', async (config) => {
    const { prisma } = createDatabase()
    await expect(seedDevelopment(prisma, config)).rejects.toThrow()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('creates usable accounts and minimal settings in one transaction', async () => {
    const { prisma, tables } = createDatabase()
    await seedDevelopment(prisma, env)

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(tables.admin[0].password).not.toBe(env.DEV_SEED_PASSWORD)
    expect(await bcrypt.compare(env.DEV_SEED_PASSWORD, tables.admin[0].password)).toBe(true)
    expect(bcrypt.getRounds(tables.admin[0].password)).toBe(12)
    for (const name of ['customer', 'driver']) {
      expect(tables[name]).toHaveLength(1)
      expect(tables[name][0]).toMatchObject({ status: true, verifiedEmail: true })
      expect(tables[name][0].password).not.toBe(env.DEV_SEED_PASSWORD)
      expect(await bcrypt.compare(env.DEV_SEED_PASSWORD, tables[name][0].password)).toBe(true)
    }
    expect(tables.airport).toHaveLength(1)
    expect(tables.fare[0]).toMatchObject({ adminId: tables.admin[0].id, farePerKm: 5000 })
  })

  it('preserves accounts and settings when run again with a different password', async () => {
    const { prisma, tables } = createDatabase()
    await seedDevelopment(prisma, env)
    tables.customer[0].name = 'Edited Customer'
    tables.fare[0].farePerKm = 9000
    const before = structuredClone(tables)

    await seedDevelopment(prisma, { ...env, DEV_SEED_PASSWORD: 'Another-dev-password' })

    expect(tables).toEqual(before)
  })

  it('does not add competing airport or fare settings to a populated database', async () => {
    const { prisma, tables } = createDatabase()
    tables.airport.push({ id: 42, name: 'Existing Airport' })
    tables.fare.push({ id: 42, farePerKm: 7000, adminId: 42 })

    await seedDevelopment(prisma, env)

    expect(tables.airport).toEqual([{ id: 42, name: 'Existing Airport' }])
    expect(tables.fare).toEqual([{ id: 42, farePerKm: 7000, adminId: 42 }])
  })
})
