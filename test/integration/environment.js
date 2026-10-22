import process from 'node:process'

// Keep this module free of application imports and dotenv loading.
if (process.env.RUN_INTEGRATION_TESTS !== 'true') {
  throw new Error('Integration tests refused: RUN_INTEGRATION_TESTS must be exactly true')
}

function required(name) {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new Error(`Integration tests refused: ${name} is required`)
  }
  return value
}

const databaseUrl = required('TEST_DATABASE_URL')
export const tokens = Object.freeze({
  admin: required('TEST_ADMIN_TOKEN'),
  customer: required('TEST_CUSTOMER_TOKEN'),
  driver: required('TEST_DRIVER_TOKEN'),
})

// Mock-only values: nodemailer is replaced in setup.js and never opens a transport.
const emailSettings = {
  SMTP_HOST: 'smtp.example.test',
  SMTP_PORT: '2525',
  AUTH_MAILER_EMAIL: 'primary@example.test',
  AUTH_MAILER_APP_PASSWORD: 'fictional-primary-password',
  REPORT_MAILER_EMAIL: 'secondary@example.test',
  REPORT_MAILER_APP_PASSWORD: 'fictional-secondary-password',
}

// Never allow inherited application settings to select the database or SMTP account.
process.env.DATABASE_URL = databaseUrl
for (const key of Object.keys(process.env)) {
  if (/^(?:EMAIL_|SMTP_|ACCOUNT_EMAIL_|REPORT_EMAIL_|AUTH_MAILER_|REPORT_MAILER_)/.test(key)) {
    delete process.env[key]
  }
}
Object.assign(process.env, emailSettings)
