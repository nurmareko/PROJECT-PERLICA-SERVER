import express from 'express'
import multer from 'multer'
import adminController from '../controller/admin-controller.js'
import customerController from '../controller/customer-controller.js'
import driverController from '../controller/driver-controller.js'
import orderController from '../controller/order-controller.js'

import orderanController from '../controller/orderan-controller.js'

import rideController from '../controller/ride-controller.js'
import { authMiddleware } from '../middleware/auth-middleware.js'

const customerRouter = new express.Router()
const driverRouter = new express.Router()
const adminRouter = new express.Router()
customerRouter.use(authMiddleware)
driverRouter.use(authMiddleware)
adminRouter.use(authMiddleware)

// Konfigurasi multer
const upload = multer()
// Customer API route
customerRouter.get('/api/customers/current', customerController.get)

// Menambahkan middleware multer untuk menangani form-data multipart
customerRouter.patch(
  '/api/customers/current',
  upload.single('image'),
  customerController.update,
)

customerRouter.patch(
  '/api/customers/changePassword',
  customerController.changePassword,
)

customerRouter.patch(
  '/api/customers/updateLocation',
  customerController.updateLocation,
)

customerRouter.patch(
  '/api/customers/updateDeviceToken',
  customerController.updateDeviceToken,
)
customerRouter.delete('/api/customers/logout', customerController.logout)
customerRouter.get(
  '/api/customers/checkAuthentication',
  customerController.checkAuthentication,
)
customerRouter.delete('/api/customers/logout', customerController.logout)

// Driver API Route

driverRouter.get(
  '/api/drivers/checkAuthentication',
  driverController.checkAuthentication,
)

driverRouter.get('/api/drivers/current', driverController.get)

driverRouter.patch(
  '/api/drivers/current',
  upload.single('image'),
  driverController.update,
)

driverRouter.patch(
  '/api/drivers/updateLocation',
  driverController.updateLocation,
)

driverRouter.patch(
  '/api/drivers/changePassword',
  driverController.changePassword,
)

driverRouter.patch(
  '/api/drivers/updateDeviceToken',
  driverController.updateDeviceToken,
)

driverRouter.delete('/api/drivers/logout', driverController.logout)

// ride by driver

driverRouter.get(
  '/api/drivers/rides/getCurrentRide',
  rideController.getCurrentRide,
)
driverRouter.post('/api/drivers/rides/addRide', rideController.addRide)

driverRouter.patch(
  '/api/drivers/rides/completeRide',
  rideController.completeRide,
)

driverRouter.patch(
  '/api/drivers/rides/completeAndCloseRide',
  rideController.completeAndCloseRide,
)

driverRouter.patch('/api/drivers/rides/cancelRide', rideController.cancelRide)

driverRouter.get(
  '/api/drivers/rides/getHistoryRide',
  rideController.getHistoryRide,
)

// order taxi by customer API

customerRouter.get(
  '/api/customers/orders/getTaxisWithinRadius',
  orderController.getTaxisWithinRadius,
)

customerRouter.get(
  '/api/customers/orders/getCurrentOrder',
  orderController.getCurrentOrder,
)

customerRouter.post('/api/customers/orders/addOrder', orderController.addOrder)
customerRouter.patch(
  '/api/customers/orders/cancelOrder',
  orderController.cancelOrder,
)

customerRouter.get(
  '/api/customers/orders/getHistoryOrder',
  orderController.getHistoryOrder,
)

customerRouter.post(
  '/api/customers/orders/sendMessage',
  orderController.sendMessage,
)

customerRouter.post(
  '/api/customers/orders/sendReport',
  orderController.sendReport,
)

customerRouter.patch(
  '/api/customers/orders/sendReview',
  orderController.sendReview,
)

// orderan by driver

driverRouter.get(
  '/api/drivers/orders/getCurrentOrderan',
  orderanController.getCurrentOrderan,
)

driverRouter.patch(
  '/api/drivers/orders/rejectOrderan',
  orderanController.rejectOrderan,
)

driverRouter.patch(
  '/api/drivers/orders/acceptOrderan',
  orderanController.acceptOrderan,
)

driverRouter.patch(
  '/api/drivers/orders/cancelOrderan',
  orderanController.cancelOrderan,
)

driverRouter.get(
  '/api/drivers/orders/getHistoryOrderan',
  orderanController.getHistoryOrderan,
)

driverRouter.patch(
  '/api/drivers/orders/updateStatusOrderan',
  orderanController.updateStatusOrderan,
)

driverRouter.patch(
  '/api/drivers/orders/updateLocationOrderan',
  orderanController.updateLocationOrderan,
)

driverRouter.post(
  '/api/drivers/orders/sendMessage',
  orderanController.sendMessage,
)

driverRouter.post(
  '/api/drivers/orders/sendReport',
  orderanController.sendReport,
)

driverRouter.patch(
  '/api/drivers/orders/sendReview',
  orderanController.sendReview,
)

// admin

adminRouter.get('/api/admin/getDriver', adminController.getDriver)
adminRouter.get('/api/admin/getCurrent', adminController.getCurrent)
adminRouter.get('/api/admin/getCustomer', adminController.getCustomer)
adminRouter.get('/api/admin/getFare', adminController.getFare)
adminRouter.patch('/api/admin/updateFare', adminController.updateFare)
adminRouter.patch(
  '/api/admin/activateDriverAccount',
  adminController.activateDriverAccount,
)
adminRouter.patch(
  '/api/admin/deactivateDriverAccount',
  adminController.deactivateDriverAccount,
)

adminRouter.patch(
  '/api/admin/deactivateCustomerAccount',
  adminController.deactivateCustomerAccount,
)

adminRouter.patch(
  '/api/admin/activateCustomerAccount',
  adminController.activateCustomerAccount,
)

adminRouter.get('/api/admin/getOrderan', adminController.getOrderan)

adminRouter.get('/api/admin/getRide', adminController.getRide)

adminRouter.delete('/api/admin/logout', adminController.logout)

export { adminRouter, customerRouter, driverRouter }
