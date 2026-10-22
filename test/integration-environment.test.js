import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../', import.meta.url))
function loadEnvironment(overrides = {}) {
  return spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict'
    import { tokens } from './test/integration/environment.js'
    assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL)
    assert.equal(new Set(Object.values(tokens)).size, 3)
    for (const token of Object.values(tokens)) {
      assert.match(token, /^[0-9a-f-]{36}$/)
      assert.notEqual(token, 'inherited-token')
    }
  `], {
    cwd: root,
    env: {
      ...process.env,
      RUN_INTEGRATION_TESTS: 'true',
      TEST_DATABASE_URL: 'mysql://test:test@localhost/perlica_test',
      TEST_ADMIN_TOKEN: 'inherited-token',
      TEST_CUSTOMER_TOKEN: 'inherited-token',
      TEST_DRIVER_TOKEN: 'inherited-token',
      ...overrides,
    },
    encoding: 'utf8',
    timeout: 10000,
  })
}

describe('integration environment', () => {
  it('generates independent tokens instead of requiring inherited credentials', () => {
    const result = loadEnvironment()
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(0)
  })

  it.each([
    { RUN_INTEGRATION_TESTS: 'false' },
    { TEST_DATABASE_URL: '' },
    { TEST_DATABASE_URL: 'mysql://test:test@localhost/production' },
    { TEST_DATABASE_URL: 'not-a-url' },
  ])('refuses unsafe configuration %j', (overrides) => {
    const result = loadEnvironment(overrides)
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('Integration tests refused:')
  })
})
