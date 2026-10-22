import process from 'node:process'
import { logger } from './application/logging.js'
import { web } from './application/web.js'
import 'dotenv/config'

const port = Number(process.env.PORT ?? 3001)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535')
}

web.listen(port, () => {
  logger.info('App started', { port })
})
