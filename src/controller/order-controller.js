// get taxi based on customer's current position

import orderService from '../service/order-service.js'

// customer part

async function getTaxisWithinRadius(req, res, next) {
  try {
    const email = req.customer.email
    const result = await orderService.getTaxisWithinRadius(email)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function getCurrentOrder(req, res, next) {
  try {
    const email = req.customer.email
    const result = await orderService.getCurrentOrder(email)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function addOrder(req, res, next) {
  try {
    const email = req.customer.email
    const orderData = req.body
    const result = await orderService.addOrder(email, orderData)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function cancelOrder(req, res, next) {
  try {
    const email = req.customer.email
    const orderId = req.body.orderId
    const result = await orderService.cancelOrder(email, orderId)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function getHistoryOrder(req, res, next) {
  try {
    const email = req.customer.email
    const result = await orderService.getHistoryOrder(email)

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
    const email = req.customer.email
    const orderId = req.body.orderId
    const message = req.body.message

    const result = await orderService.sendMessage(email, orderId, message)

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
    const email = req.customer.email
    const orderId = req.body.orderId
    const message = req.body.message

    const result = await orderService.sendReport(email, orderId, message)

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
    const email = req.customer.email
    const orderId = req.body.orderId
    const rating = req.body.rating
    const review = req.body.review

    const result = await orderService.sendReview(
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
  getTaxisWithinRadius,
  getCurrentOrder,
  addOrder,
  cancelOrder,
  getHistoryOrder,
  sendMessage,
  sendReport,
  sendReview,
}
