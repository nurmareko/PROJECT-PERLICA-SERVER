import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logger } from '../src/application/logging.js'
import { web } from '../src/application/web.js'

vi.mock('dotenv/config', () => ({}))
vi.mock('../src/application/logging.js', () => ({ logger: { info: vi.fn() } }))
vi.mock('../src/application/web.js', () => ({ web: { listen: vi.fn() } }))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.stubEnv('PORT', undefined)
  web.listen.mockImplementation((_port, callback) => callback())
})

afterEach(() => vi.unstubAllEnvs())

describe('server port configuration', () => {
  it('defaults to port 3001 when PORT is unset', async () => {
    await import('../src/main.js')
    expect(web.listen).toHaveBeenCalledWith(3001, expect.any(Function))
  })

  it.each(['4000', '1', '65535'])('uses PORT=%s as a numeric port', async (port) => {
    vi.stubEnv('PORT', port)
    await import('../src/main.js')
    expect(web.listen).toHaveBeenCalledWith(Number(port), expect.any(Function))
    expect(logger.info).toHaveBeenCalledWith('App started', { port: Number(port) })
  })

  it.each(['', ' ', 'abc', '0', '-1', '65536', '3000.5', '3000abc'])('rejects invalid PORT=%j without listening', async (port) => {
    vi.stubEnv('PORT', port)
    await expect(import('../src/main.js')).rejects.toThrow('PORT must be an integer between 1 and 65535')
    expect(web.listen).not.toHaveBeenCalled()
  })
})
