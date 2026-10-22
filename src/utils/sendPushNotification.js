import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { logger } from '../application/logging.js'

// Membaca dan menginisialisasi Firebase Admin SDK
const serviceAccount = JSON.parse(
  readFileSync('./src/config/push-notification-key.json'),
)

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
})

/**
 * Fungsi untuk mengirim notifikasi push
 * @param {string} title - Judul notifikasi
 * @param {string} body - Isi notifikasi
 * @param {string} token - Token perangkat yang akan menerima notifikasi
 * @param {object} data - Data tambahan (opsional, misalnya orderId)
 * @returns {Promise<void>}
 */
async function sendPushNotification(title, body, token, data = {}) {
  // Konversi semua nilai dalam data menjadi string
  const stringifiedData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, String(value)]),
  )

  const message = {
    notification: {
      title,
      body,
    },
    token,
    data: stringifiedData,
  }

  logger.info('Sending push notification')

  try {
    await getMessaging(app).send(message)
    logger.info('Push notification sent successfully')
  }
  catch (error) {
    logger.error('Failed to send push notification', { code: error.code })
  }
}

export default sendPushNotification
