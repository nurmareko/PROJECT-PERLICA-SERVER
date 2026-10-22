import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const env = { ...process.env, RUN_INTEGRATION_TESTS: 'false' }
for (const key of Object.keys(env)) {
  if (['TEST_DATABASE_URL', 'TEST_ADMIN_TOKEN', 'TEST_CUSTOMER_TOKEN', 'TEST_DRIVER_TOKEN'].includes(key)
    || /^(?:TEST_EMAIL_|EMAIL_|SMTP_|ACCOUNT_EMAIL_|REPORT_EMAIL_|AUTH_MAILER_|REPORT_MAILER_)/.test(key)) {
    delete env[key]
  }
}

// Exercise both the config guard and direct discovery without the integration config.
// Never forward child output: a regression could include sensitive application logs.
for (const args of [
  ['--config', 'vitest.integration.config.js'],
  ['--globals', 'test/integration/admin.test.js'],
]) {
  const result = spawnSync(process.execPath, [
    'node_modules/vitest/vitest.mjs',
    'run',
    ...args,
  ], { cwd: root, env, encoding: 'utf8', timeout: 30000 })

  assert.ifError(result.error)
  assert.notEqual(result.status, 0, 'Integration execution must refuse without opt-in')
  assert.match(
    `${result.stdout}${result.stderr}`,
    /Integration tests refused: RUN_INTEGRATION_TESTS must be exactly true/,
    'Expected the integration guard to refuse execution',
  )
}
console.warn('Config and direct-discovery refusal checks passed; integration opt-in was never enabled')
