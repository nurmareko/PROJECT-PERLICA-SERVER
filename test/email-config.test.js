import process from 'node:process'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }))
vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn() } }))

const settings = {
  SMTP_HOST: 'smtp.example.test',
  SMTP_PORT: '2525',
  AUTH_MAILER_EMAIL: 'account@example.test',
  AUTH_MAILER_APP_PASSWORD: 'fictional-account-password',
  REPORT_MAILER_EMAIL: 'report@example.test',
  REPORT_MAILER_APP_PASSWORD: 'fictional-report-password',
}
const info = { messageId: 'mock-only' }
const sendMail = vi.fn()

beforeEach(() => {
  vi.resetModules()
  vi.resetAllMocks()
  for (const key of Object.keys(process.env)) {
    if (/^(?:EMAIL_|SMTP_|ACCOUNT_EMAIL_|REPORT_EMAIL_|AUTH_MAILER_|REPORT_MAILER_)/.test(key)) {
      vi.stubEnv(key, undefined)
    }
  }
  for (const [key, value] of Object.entries(settings)) {
    vi.stubEnv(key, value)
  }
  nodemailer.createTransport.mockReturnValue({ sendMail })
  sendMail.mockImplementation((_options, callback) => {
    if (callback) {
      callback(null, info)
      return undefined
    }
    return Promise.resolve(info)
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

function expectTransport(account) {
  expect(dotenv.config).toHaveBeenCalledExactlyOnceWith()
  expect(nodemailer.createTransport).toHaveBeenCalledExactlyOnceWith({
    service: 'gmail',
    host: settings.SMTP_HOST,
    port: settings.SMTP_PORT,
    secure: false,
    auth: {
      user: settings[`${account}_MAILER_EMAIL`],
      pass: settings[`${account}_MAILER_APP_PASSWORD`],
    },
  })
}

const accountCases = [
  ['sendEmailAccountStatus', 'sendCustomerAccountActivationEmail'],
  ['sendEmailAccountStatus', 'sendCustomerAccountDeactivationEmail'],
  ['sendEmailAccountStatus', 'sendDriverAccountActivationEmail'],
  ['sendEmailAccountStatus', 'sendDriverAccountDeactivationEmail'],
  ['sendEmailForgotPassword', 'sendOTPForgotPasswordCustomerByEmail'],
  ['sendEmailForgotPassword', 'sendOTPForgotPasswordDriverByEmail'],
  ['sendEmailRegister', 'sendOTPRegisterCustomerByEmail'],
  ['sendEmailRegister', 'sendOTPRegisterDriverByEmail'],
]

describe('email configuration without real delivery', () => {
  it.each(accountCases)('%s: %s uses the account sender and credentials', async (moduleName, functionName) => {
    const emails = await import(`../src/utils/${moduleName}.js`)
    await expect(emails[functionName]('recipient@example.test', '123456', 'Test User')).resolves.toEqual(info)

    expectTransport('AUTH')
    expect(sendMail).toHaveBeenCalledTimes(1)
    expect(sendMail.mock.calls[0][0]).toMatchObject({
      from: settings.AUTH_MAILER_EMAIL,
      to: 'recipient@example.test',
    })
  })

  it.each([
    ['sendCustomerReportEmail', 'REPORT'],
    ['sendDriverReportEmail', 'AUTH'],
  ])('%s preserves sender and recipients with report credentials', async (functionName, sender) => {
    const emails = await import('../src/utils/sendEmailReport.js')
    await expect(emails[functionName]('recipient@example.test', 'Test User', 'order-1', 'Test complaint'))
      .resolves
      .toEqual([info, info])

    expectTransport('REPORT')
    expect(sendMail).toHaveBeenCalledTimes(2)
    expect(sendMail.mock.calls.map(([options]) => ({ from: options.from, to: options.to }))).toEqual([
      { from: settings[`${sender}_MAILER_EMAIL`], to: settings.AUTH_MAILER_EMAIL },
      { from: settings[`${sender}_MAILER_EMAIL`], to: 'recipient@example.test' },
    ])
  })

  it('clears inherited SMTP and email settings before assigning fictional integration values', async () => {
    vi.stubEnv('RUN_INTEGRATION_TESTS', 'true')
    vi.stubEnv('TEST_DATABASE_URL', 'mysql://fictional:fictional@localhost:3306/mock_only_test')

    vi.stubEnv('DATABASE_URL', undefined)
    for (const prefix of ['EMAIL_', 'SMTP_', 'ACCOUNT_EMAIL_', 'REPORT_EMAIL_', 'AUTH_MAILER_', 'REPORT_MAILER_']) {
      vi.stubEnv(`${prefix}INHERITED`, 'must-be-removed')
    }

    // This module only configures the environment; no application or database imports.
    await import('./integration/environment.js')

    for (const prefix of ['EMAIL_', 'SMTP_', 'ACCOUNT_EMAIL_', 'REPORT_EMAIL_', 'AUTH_MAILER_', 'REPORT_MAILER_']) {
      expect(process.env[`${prefix}INHERITED`]).toBeUndefined()
    }
    expect(process.env).toMatchObject({
      SMTP_HOST: 'smtp.example.test',
      SMTP_PORT: '2525',
      AUTH_MAILER_EMAIL: 'primary@example.test',
      AUTH_MAILER_APP_PASSWORD: 'fictional-primary-password',
      REPORT_MAILER_EMAIL: 'secondary@example.test',
      REPORT_MAILER_APP_PASSWORD: 'fictional-secondary-password',
    })
    expect(nodemailer.createTransport).not.toHaveBeenCalled()
    expect(dotenv.config).not.toHaveBeenCalled()
  })

  it('refuses integration environment setup without explicit opt-in', async () => {
    vi.stubEnv('RUN_INTEGRATION_TESTS', 'false')
    await expect(import('./integration/environment.js')).rejects.toThrow('Integration tests refused: RUN_INTEGRATION_TESTS must be exactly true')
    expect(nodemailer.createTransport).not.toHaveBeenCalled()
    expect(dotenv.config).not.toHaveBeenCalled()
  })
})
