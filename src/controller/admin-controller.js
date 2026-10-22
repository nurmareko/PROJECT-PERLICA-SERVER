import { logger } from '../application/logging.js'
import adminService from '../service/admin-service.js'

// login

async function login(req, res, next) {
  try {
    const result = await adminService.login(req.body)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function getCurrent(req, res, next) {
  try {
    const email = req.admin.email
    const result = await adminService.getCurrent(email)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function getDriver(req, res, next) {
  try {
    // const email = req.admin.email;
    const result = await adminService.getDriver()
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function getCustomer(req, res, next) {
  try {
    // const email = req.admin.email;
    const result = await adminService.getCustomer()
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function getFare(req, res, next) {
  try {
    // const email = req.admin.email;
    const result = await adminService.getFare()
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function updateFare(req, res, next) {
  try {
    const email = req.admin.email
    const fareId = req.body.fareId
    const farePerKm = req.body.farePerKm
    const result = await adminService.updateFare(email, fareId, farePerKm)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function activateDriverAccount(req, res, next) {
  try {
    // const email = req.admin.email;
    const driverId = req.body.driverId
    logger.info('Driver account activation requested')
    const result = await adminService.activateDriverAccount(driverId)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function deactivateDriverAccount(req, res, next) {
  try {
    // const email = req.admin.email;
    const driverId = req.body.driverId
    const reason = req.body.reason
    const result = await adminService.deactivateDriverAccount(driverId, reason)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function activateCustomerAccount(req, res, next) {
  try {
    // const email = req.admin.email;
    const customerId = req.body.customerId
    logger.info('Customer account activation requested')
    const result = await adminService.activateCustomerAccount(customerId)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function deactivateCustomerAccount(req, res, next) {
  try {
    // const email = req.admin.email;
    const customerId = req.body.customerId
    const reason = req.body.reason
    const result = await adminService.deactivateCustomerAccount(
      customerId,
      reason,
    )
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function getOrderan(req, res, next) {
  try {
    // const email = req.admin.email;
    const result = await adminService.getOrderan()
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function getRide(req, res, next) {
  try {
    // const email = req.admin.email;
    const result = await adminService.getRide()
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function logout(req, res, next) {
  try {
    await adminService.logout(req.admin.email)
    res.status(200).json({
      data: 'OK',
    })
  }
  catch (e) {
    next(e)
  }
}

export default {
  login,
  getCurrent,
  getDriver,
  getCustomer,
  getFare,
  updateFare,
  activateDriverAccount,
  deactivateDriverAccount,
  activateCustomerAccount,
  deactivateCustomerAccount,
  getOrderan,
  getRide,
  logout,
}
