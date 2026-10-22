import { beforeAll } from 'vitest'
import './setup.js'

export { tokens } from './environment.js'
export const logger = { info: () => {} }
let application
export const web = (request, response) => application(request, response)

// Defer application evaluation until the guard and boundary mocks have completed,
// including when a test is discovered without the integration configuration.
beforeAll(async () => {
  application = (await import('../../src/application/web.js')).web
})
