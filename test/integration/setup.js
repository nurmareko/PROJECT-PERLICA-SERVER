import { vi } from 'vitest'
import './environment.js'

// No .env files may restore inherited database or service settings.
vi.mock('dotenv/config', () => ({}))
vi.mock('dotenv', () => ({ default: { config: () => ({ parsed: {} }) } }))

// Mock the whole module: mocking only firebase-admin still reads the credential file.
vi.mock('../../src/utils/sendPushNotification.js', () => ({
  default: async () => {},
}))
vi.mock('../../src/config/firebase-client.config.js', () => ({
  storage: {},
}))
vi.mock('firebase/app', () => ({ initializeApp: () => ({}) }))
vi.mock('firebase/storage', () => ({
  getStorage: () => ({}),
  ref: () => ({}),
  uploadBytesResumable: async () => ({ ref: {} }),
  getDownloadURL: async () => 'https://storage.example.com/fictional-upload.png',
}))

// Support both callback and promise callers without creating an SMTP transport.
vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: (_options, callback) => {
        const info = { messageId: 'fictional-message-not-delivered' }
        if (callback) {
          callback(null, info)
        }
        return Promise.resolve(info)
      },
    }),
  },
}))

// Maps uses an inherited hardcoded API key. Refuse rather than fabricate route data.
vi.mock('axios', () => ({
  default: {
    get: async () => {
      throw new Error('External HTTP requests are disabled in integration tests')
    },
  },
}))

// Application query/error logs can include credentials, tokens, or account data.
vi.mock('../../src/application/logging.js', () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}))
