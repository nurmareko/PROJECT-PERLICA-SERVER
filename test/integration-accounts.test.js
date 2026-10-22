import bcrypt from 'bcryptjs'
import { describe, expect, it, vi } from 'vitest'
import { loginAdminValidation } from '../src/validation/admin-validation.js'
import { loginCustomerValidation } from '../src/validation/customer-validation.js'
import { loginDriverValidation } from '../src/validation/driver-validation.js'
import { createAccounts } from './integration/accounts.js'

const tokens = { admin: 'test-admin-token', customer: 'test-customer-token', driver: 'test-driver-token' }
const models = ['admin', 'customer', 'driver', 'review', 'report', 'message', 'notification', 'order', 'ride', 'fare']

function fakePrisma() {
  const tables = Object.fromEntries(models.map(name => [name, []]))
  const calls = []
  const failures = {}
  let nextId = 100
  const prisma = {
    $transaction: vi.fn(async (callback) => {
      const draft = structuredClone(tables)
      const tx = Object.fromEntries(models.map(name => [name, {
        async create({ data }) {
          if (failures[name])
            throw failures[name]
          const row = { id: nextId++, ...data }
          draft[name].push(row)
          return row
        },
        async deleteMany({ where }) {
          calls.push({ model: name, where })
          if (failures[name])
            throw failures[name]
          function matches(row, filter) {
            return Object.entries(filter).every(([key, value]) => key === 'OR'
              ? value.some(branch => matches(row, branch))
              : row[key] === value)
          }
          draft[name] = draft[name].filter(row => !matches(row, where))
        },
      }]))
      const result = await callback(tx)
      Object.assign(tables, draft)
      return result
    }),
  }
  return { prisma, tables, calls, failures }
}

describe('integration accounts', () => {
  it.each([
    ['admin', loginAdminValidation],
    ['customer', loginCustomerValidation],
    ['driver', loginDriverValidation],
  ])('generates credentials accepted by the application %s login validator', async (role, validator) => {
    const { prisma } = fakePrisma()
    const accounts = await createAccounts(prisma, tokens)
    const credentials = {
      email: accounts[role].email,
      password: accounts.credentials.password,
    }

    const { error, value } = validator.validate(credentials)

    expect(error).toBeUndefined()
    expect(value).toEqual(credentials)
  })
  it('creates complete unique accounts with supplied tokens and real random password hashes atomically', async () => {
    const { prisma, tables } = fakePrisma()
    const hash = vi.spyOn(bcrypt, 'hash')
    try {
      const before = Date.now()
      const first = await createAccounts(prisma, tokens)
      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
      const second = await createAccounts(prisma, tokens)
      expect(prisma.$transaction).toHaveBeenCalledTimes(2)
      expect(Object.keys(first).sort()).toEqual(['admin', 'cleanup', 'credentials', 'customer', 'driver', 'fare'])
      expect(first.credentials.password).not.toBe(second.credentials.password)
      expect(first.cleanup).toBeTypeOf('function')
      const emails = new Set()
      const phones = new Set()
      for (const accounts of [first, second]) {
        expect(accounts.credentials.password).toBeTypeOf('string')
        expect(accounts.credentials.password.length).toBeGreaterThanOrEqual(32)
        expect(accounts.fare).toMatchObject({ adminId: accounts.admin.id, farePerKm: 15000 })
        expect(tables.fare).toContainEqual(accounts.fare)
        expect(JSON.stringify(tables)).not.toContain(accounts.credentials.password)
        for (const role of ['admin', 'customer', 'driver']) {
          const account = accounts[role]
          expect(tables[role]).toContainEqual(account)
          expect(account.email).toMatch(/^[^@]*[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}@example\.com$/)
          expect(account.email.length).toBeLessThanOrEqual(255)
          emails.add(account.email)
          expect(account.phoneNumber).toMatch(/^\+?\d{10,20}$/)
          phones.add(account.phoneNumber)
          expect(account.token).toBe(tokens[role])
          expect(account.tokenExpiry).toBeInstanceOf(Date)
          expect(account.tokenExpiry.getTime()).toBeGreaterThan(Date.now())
          expect(bcrypt.getRounds(account.password)).toBe(12)
          expect(account.password).not.toBe(accounts.credentials.password)
          expect(await bcrypt.compare(accounts.credentials.password, account.password)).toBe(true)
        }
        expect(accounts.admin.username).toBeTruthy()
        expect(accounts.admin.fullName).toBeTruthy()
        for (const field of ['createDatetime', 'updateDatetime']) {
          expect(accounts.admin[field]).toBeInstanceOf(Date)
          expect(accounts.admin[field].getTime()).toBeGreaterThanOrEqual(before)
        }
        for (const role of ['customer', 'driver']) {
          expect(accounts[role]).toMatchObject({ verifiedEmail: true, status: true })
          expect(accounts[role].name).toBeTruthy()
        }
        expect(accounts.driver.noMembership.length).toBeGreaterThan(0)
        expect(accounts.driver.noMembership.length).toBeLessThanOrEqual(20)
        expect(accounts.driver.licensePlate.length).toBeGreaterThan(0)
        expect(accounts.driver.licensePlate.length).toBeLessThanOrEqual(10)
      }
      expect(emails.size).toBe(6)
      expect(phones.size).toBe(6)
      expect(first.driver.noMembership).not.toBe(second.driver.noMembership)
      expect(first.driver.licensePlate).not.toBe(second.driver.licensePlate)
      const passwords = hash.mock.calls.map(([password]) => password)
      expect(new Set(passwords).size).toBeGreaterThanOrEqual(2)
    }
    finally {
      hash.mockRestore()
    }
  }, 30000)

  it('cleans only generated IDs in dependency order and preserves unrelated rows', async () => {
    const { prisma, tables, calls } = fakePrisma()
    const { admin, customer, driver, cleanup } = await createAccounts(prisma, tokens)
    for (const name of models)
      tables[name].push({ id: -1, customerId: -1, driverId: -1, adminId: -1 })
    const where = { OR: [{ customerId: customer.id }, { driverId: driver.id }] }
    const children = ['review', 'report', 'message', 'notification', 'order']
    for (const name of children) {
      tables[name].push({ id: 1, customerId: customer.id, driverId: -1 })
      tables[name].push({ id: 2, customerId: -1, driverId: driver.id })
    }
    tables.ride.push({ id: 1, driverId: driver.id })

    await cleanup()
    expect(prisma.$transaction).toHaveBeenCalledTimes(2)
    expect(calls).toEqual([
      ...children.map(model => ({ model, where })),
      { model: 'ride', where: { driverId: driver.id } },
      { model: 'fare', where: { adminId: admin.id } },
      { model: 'customer', where: { id: customer.id } },
      { model: 'driver', where: { id: driver.id } },
      { model: 'admin', where: { id: admin.id } },
    ])
    for (const name of models)
      expect(tables[name]).toEqual([{ id: -1, customerId: -1, driverId: -1, adminId: -1 }])
    await cleanup()
    for (const name of models)
      expect(tables[name]).toHaveLength(1)
  })

  it.each(['driver', 'fare'])('propagates %s creation failure without committing partial accounts or fare', async (model) => {
    const { prisma, tables, failures } = fakePrisma()
    failures[model] = new Error('create failed')
    await expect(createAccounts(prisma, tokens)).rejects.toBe(failures[model])
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    for (const name of models)
      expect(tables[name]).toEqual([])
  })

  it('propagates cleanup failure without committing partial deletion', async () => {
    const { prisma, tables, failures } = fakePrisma()
    const accounts = await createAccounts(prisma, tokens)
    tables.review.push({ id: 1, customerId: accounts.customer.id })
    const before = structuredClone(tables)
    failures.order = new Error('delete failed')
    await expect(accounts.cleanup()).rejects.toBe(failures.order)
    expect(tables).toEqual(before)
    expect(prisma.$transaction).toHaveBeenCalledTimes(2)
  })
})
