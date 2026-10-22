import cors from 'cors'
import express from 'express'
import { errorMiddleware } from '../middleware/error-middleware.js'
import { adminRouter, customerRouter, driverRouter } from '../route/api.js'
import { publicRouter } from '../route/public-api.js'

export const web = express()

web.use(cors())
web.use(express.json())
web.use(publicRouter)

web.use(customerRouter)
web.use(driverRouter)
web.use(adminRouter)

web.use(errorMiddleware)
