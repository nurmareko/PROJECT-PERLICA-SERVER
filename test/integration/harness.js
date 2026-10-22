import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { createAccounts } from './accounts.js'
import { tokens } from './environment.js'
import './setup.js'

export { tokens } from './environment.js'
export const logger = { info: () => {} }
export const accounts = {}
let application
let prismaClient
let fixtures
export const web = (request, response) => application(request, response)

// Defer application evaluation until the guard and boundary mocks have completed,
// including when a test is discovered without the integration configuration.
beforeAll(async () => {
  application = (await import('../../src/application/web.js')).web
  prismaClient = (await import('../../src/application/database.js')).prismaClient
})

beforeEach(async () => {
  fixtures = await createAccounts(prismaClient, tokens)
  Object.assign(accounts, {
    admin: fixtures.admin,
    customer: fixtures.customer,
    driver: fixtures.driver,
    credentials: fixtures.credentials,
    fare: fixtures.fare,
  })
})

afterEach(async () => {
  try {
    await fixtures?.cleanup()
  }
  finally {
    fixtures = undefined
    for (const role of Object.keys(accounts)) {
      delete accounts[role]
    }
  }
})

afterAll(async () => {
  await prismaClient?.$disconnect()
})
