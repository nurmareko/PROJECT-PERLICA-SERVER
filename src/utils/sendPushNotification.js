import { logger } from '../application/logging.js'
import { messaging } from '../config/firebase-admin.config.js'

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
    await messaging.send(message)
    logger.info('Push notification sent successfully')
  }
  catch (error) {
    logger.error('Failed to send push notification', { code: error.code })
  }
}

export default sendPushNotification
