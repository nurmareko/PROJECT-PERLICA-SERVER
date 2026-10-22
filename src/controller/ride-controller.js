// add ride by driver

import rideService from '../service/ride-service.js'

async function getCurrentRide(req, res, next) {
  try {
    const email = req.driver.email
    const result = await rideService.getCurrentRide(email)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function addRide(req, res, next) {
  try {
    const email = req.driver.email
    const requestData = req.body

    const result = await rideService.addRide(email, requestData)
    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function completeRide(req, res, next) {
  try {
    const email = req.driver.email
    const rideId = req.body.rideId

    const result = await rideService.completeRide(email, rideId)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function cancelRide(req, res, next) {
  try {
    const email = req.driver.email
    const rideId = req.body.rideId

    const result = await rideService.cancelRide(email, rideId)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function completeAndCloseRide(req, res, next) {
  try {
    const email = req.driver.email
    const rideId = req.body.rideId

    const result = await rideService.completeAndCloseRide(email, rideId)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

async function getHistoryRide(req, res, next) {
  try {
    const email = req.driver.email
    const result = await rideService.getHistoryRide(email)

    res.status(200).json({
      data: result,
    })
  }
  catch (e) {
    next(e)
  }
}

export default {
  getCurrentRide,
  addRide,
  completeRide,
  completeAndCloseRide,
  cancelRide,
  getHistoryRide,
}
