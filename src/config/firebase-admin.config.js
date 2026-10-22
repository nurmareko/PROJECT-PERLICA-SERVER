import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

const serviceAccount = JSON.parse(
  readFileSync(new URL('./push-notification-key.json', import.meta.url), 'utf8'),
)

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
})

export const messaging = getMessaging(app)
