// get taxi based on driver's current position

import orderanService from '../service/orderan-service.js'

// driver part

async function getCurrentOrderan(req, res, next) {
  try {
    const email = req.driver.email
    const result = await orderanService.getCurrentOrderan(email)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function rejectOrderan(req, res, next) {
  try {
    const email = req.driver.email
    const orderId = req.body.orderId
    const result = await orderanService.rejectOrderan(email, orderId)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function acceptOrderan(req, res, next) {
  try {
    const email = req.driver.email
    const orderId = req.body.orderId
    const result = await orderanService.acceptOrderan(email, orderId)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function cancelOrderan(req, res, next) {
  try {
    const email = req.driver.email
    const orderId = req.body.orderId
    const result = await orderanService.cancelOrderan(email, orderId)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function getHistoryOrderan(req, res, next) {
  try {
    const email = req.driver.email
    const result = await orderanService.getHistoryOrderan(email)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function updateStatusOrderan(req, res, next) {
  try {
    const email = req.driver.email
    const orderId = req.body.orderId
    const orderStatus = req.body.status
    const result = await orderanService.updateStatusOrderan(
      email,
      orderId,
      orderStatus,
    )

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function updateLocationOrderan(req, res, next) {
  try {
    const email = req.driver.email
    const requestData = req.body
    const result = await orderanService.updateLocationOrderan(
      email,
      requestData,
    )

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function sendMessage(req, res, next) {
  try {
    const email = req.driver.email
    const orderId = req.body.orderId
    const message = req.body.message

    const result = await orderanService.sendMessage(email, orderId, message)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function sendReport(req, res, next) {
  try {
    const email = req.driver.email
    const orderId = req.body.orderId
    const message = req.body.message

    const result = await orderanService.sendReport(email, orderId, message)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function sendReview(req, res, next) {
  try {
    const email = req.driver.email
    const orderId = req.body.orderId
    const rating = req.body.rating
    const review = req.body.review

    const result = await orderanService.sendReview(
      email,
      orderId,
      rating,
      review,
    )

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

export default {
  getCurrentOrderan,
  rejectOrderan,
  acceptOrderan,
  cancelOrderan,
  getHistoryOrderan,
  updateStatusOrderan,
  updateLocationOrderan,
  sendMessage,
  sendReport,
  sendReview,
}
