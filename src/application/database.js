import process from 'node:process'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client.ts'
import { logger } from './logging.js'
import 'dotenv/config'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

export const prismaClient = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL),
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
})

prismaClient.$on('error', (e) => {
  logger.error(e)
})

prismaClient.$on('warn', (e) => {
  logger.warn(e)
})

prismaClient.$on('info', (e) => {
  logger.info(e)
})

prismaClient.$on('query', (e) => {
  logger.info(e)
})
