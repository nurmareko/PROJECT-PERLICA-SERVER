import process from 'node:process'
import axios from 'axios'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { prismaClient } from '../application/database.js'
import { logger } from '../application/logging.js'
import { ResponseError } from '../error/response-error.js'

import { sendCustomerReportEmail } from '../utils/sendEmailReport.js'
import sendPushNotification from '../utils/sendPushNotification.js'
import 'dotenv/config'

function getMapsApiKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim()
  if (!key) {
    throw new ResponseError(503, 'Maps service is not configured')
  }
  return key
}

function formattedDuration(seconds) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes} menit`
}

function formattedDistance(meters) {
  const kilometers = meters / 1000
  return `${kilometers.toFixed(1)} km`
}

function haversineDistance(lat1, long1, lat2, long2) {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLong = (long2 - long1) * (Math.PI / 180)
  const a
    = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(lat1 * (Math.PI / 180))
      * Math.cos(lat2 * (Math.PI / 180))
      * Math.sin(dLong / 2)
      * Math.sin(dLong / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c * 1000
  return distance
}

async function getAddress(lat, long) {
  const apiKey = getMapsApiKey()
  try {
    logger.info('Fetching address')

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${apiKey}`,
    )

    logger.info('Address response received')

    if (
      response.data.results.length > 0
      && response.data.results[0].formatted_address
    ) {
      return response.data.results[0].formatted_address
    }
    else {
      console.error('No address found for given coordinates')
      throw new ResponseError(404, 'No address found')
    }
  }
  catch {
    console.error('Error getting address')
    throw new ResponseError(500, 'Failed to fetch address data')
  }
}

async function getDirections(
  originLat,
  originLong,
  destinationLat,
  destinationLong,
) {
  const directionsFromResponse = (data) => {
    if (data === null || typeof data !== 'object') {
      throw new ResponseError(502, 'Invalid directions response')
    }

    const routes = data.routes

    if (routes.length === 0) {
      throw new ResponseError(404, 'No driving route found')
    }

    const route = routes[0]
    const distance = route.distanceMeters
    const durationText = route.duration
    const duration = Number(durationText.slice(0, -1))

    return { distance, duration }
  }

  const apiKey = getMapsApiKey()
  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes'
  const data = {
    origin: {
      location: {
        latLng: {
          latitude: originLat,
          longitude: originLong,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destinationLat,
          longitude: destinationLong,
        },
      },
    },
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
    },
    timeout: 10000,
  }

  let response

  try {
    response = await axios.post(url, data, config)
  }
  catch {
    logger.error('Google Routes request failed')
    throw new ResponseError(502, 'Failed to fetch directions data')
  }

  return directionsFromResponse(response.data)
}

async function getTaxisWithinRadius(email) {
  // Validate email or handle any necessary validation
  // email = validate(getCustomerValidation, email);

  // Fetch customer details
  const customer = await prismaClient.customer.findUnique({
    where: { email },
    select: { lat: true, long: true, name: true },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer not found', email)
  }

  // Fetch airport details
  const airport = await prismaClient.airport.findFirst({
    select: { lat: true, long: true },
  })

  if (!airport) {
    throw new ResponseError(404, 'Airport not found')
  }

  // Calculate distance from customer to airport
  const customerToAirportEstimate = await getDirections(
    customer.lat,
    customer.long,
    airport.lat,
    airport.long,
  )

  const fareResult = await prismaClient.fare.findFirst({
    select: {
      farePerKm: true,
    },
  })

  const farePerKm = fareResult ? Number.parseFloat(fareResult.farePerKm) : 0
  const travelCost = (customerToAirportEstimate.distance / 1000) * farePerKm
  const roundedTravelCost = Math.round(travelCost / 1000) * 1000

  // Fetch all rides with status 0 or 2
  const rides = await prismaClient.ride.findMany({
    where: {
      rideStatus: {
        in: [0, 1],
      },
    },
    select: {
      id: true,
      lat: true,
      long: true,
      rideStatus: true,
      pickupRadius: true,
      driverId: true,
      createDatetime: true,
      updateDatetime: true,
      Driver: {
        select: {
          id: true,
          name: true,
          licensePlate: true,
          photo: true,
          lat: true,
          long: true,
        },
      },
    },
  })

  const validEnrichedRides = []

  for (const ride of rides) {
    // Check if ride ID is in the orders table
    const orders = await prismaClient.order.findMany({
      where: {
        rideId: ride.id,
      },
      select: {
        status: true,
      },
    })

    // If there are no orders or all orders have status other than 5, 6, or 7, include in validEnrichedRides
    if (
      orders.length === 0
      || !orders.some(order => ![5, 6, 7].includes(order.status))
    ) {
      const distance = haversineDistance(
        customer.lat,
        customer.long,
        ride.lat,
        ride.long,
      )
      if (distance <= ride.pickupRadius) {
        let distanceEstimate
        let durationEstimate

        if (ride.rideStatus === 0) {
          const driverToRideEstimate = await getDirections(
            ride.Driver.lat,
            ride.Driver.long,
            ride.lat,
            ride.long,
          )
          const rideToCustomerEstimate = await getDirections(
            ride.lat,
            ride.long,
            customer.lat,
            customer.long,
          )
          distanceEstimate
            = driverToRideEstimate.distance + rideToCustomerEstimate.distance
          durationEstimate
            = driverToRideEstimate.duration + rideToCustomerEstimate.duration
        }
        else if (ride.rideStatus === 1) {
          const driverToCustomerEstimate = await getDirections(
            ride.Driver.lat,
            ride.Driver.long,
            customer.lat,
            customer.long,
          )
          distanceEstimate = driverToCustomerEstimate.distance
          durationEstimate = driverToCustomerEstimate.duration
        }

        // Fetch all ratings from reviews that are not 0 based on driver id
        const reviews = await prismaClient.review.findMany({
          where: {
            driverId: ride.driverId,
            driverRating: {
              not: 0,
            },
          },
          select: {
            driverRating: true,
          },
        })

        // Calculate average driver rating
        const averageRating
          = reviews.reduce((sum, review) => sum + review.driverRating, 0)
            / (reviews.length || 1)

        const enrichedRide = {
          id: ride.id,
          lat: ride.lat,
          long: ride.long,
          rideStatus: ride.rideStatus,
          pickupRadius: ride.pickupRadius,
          createDateTime: format(
            new Date(ride.createDatetime),
            'dd-MM-yyyy HH:mm',
            {
              locale: id,
            },
          ),
          updateDateTime: format(
            new Date(ride.updateDatetime),
            'dd-MM-yyyy HH:mm',
            {
              locale: id,
            },
          ),
          driverInfo: {
            id: ride.Driver.id,
            name: ride.Driver.name,
            licensePlate: ride.Driver.licensePlate,
            photo: ride.Driver.photo,
            lat: ride.Driver.lat,
            long: ride.Driver.long,
            averageRating,
          },
          distances: {
            driverToCustomerDistanceEstimate:
              formattedDistance(distanceEstimate),
            customerToAirportDistanceEstimate: formattedDistance(
              customerToAirportEstimate.distance,
            ),
          },
          durations: {
            driverToCustomerDurationEstimate:
              formattedDuration(durationEstimate),
            customerToAirportArrivalDurationEstimate: formattedDuration(
              durationEstimate + customerToAirportEstimate.duration,
            ),
          },
          airport: airport.name,
          estimatedCost: `Rp${roundedTravelCost.toLocaleString('id-ID')}`, // Adding estimated travel cost with Rupiah format
        }

        validEnrichedRides.push(enrichedRide)
      }
    }
  }

  // Get customer address
  const customerAddress = await getAddress(customer.lat, customer.long)

  // Sort the validEnrichedRides array by driverToCustomerDurationEstimate in ascending order
  validEnrichedRides.sort((a, b) => {
    const durationA = parseDuration(
      a.durations.driverToCustomerDurationEstimate,
    )
    const durationB = parseDuration(
      b.durations.driverToCustomerDurationEstimate,
    )
    return durationA - durationB
  })

  // Helper function to parse formattedDuration back to numeric value (in seconds)
  function parseDuration(formattedDuration) {
    // Assuming formattedDuration is in "hh:mm:ss" or "mm:ss" format
    const parts = formattedDuration.split(':').map(Number)
    if (parts.length === 3) {
      // Format "hh:mm:ss"
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    else if (parts.length === 2) {
      // Format "mm:ss"
      return parts[0] * 60 + parts[1]
    }
    return 0 // Return 0 if parsing fails
  }

  return {
    customerLocation: {
      lat: customer.lat,
      long: customer.long,
      address: customerAddress,
    },
    availableRidesCount: validEnrichedRides.length,
    rides: validEnrichedRides,
  }
}

async function addOrder(customerEmail, orderData) {
  const customer = await prismaClient.customer.findUnique({
    where: { email: customerEmail },
    select: {
      id: true,
      email: true,
      lat: true,
      long: true,
    },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer not found', customerEmail)
  }

  const existingCustomerOrders = await prismaClient.order.findMany({
    where: {
      customerId: customer.id,
    },
    select: {
      id: true,
      status: true,
    },
  })

  if (
    existingCustomerOrders.some(order => ![4, 5, 6, 7].includes(order.status))
  ) {
    throw new ResponseError(400, 'Cannot add new order: existing order.')
  }

  const ride = await prismaClient.ride.findUnique({
    where: {
      id: orderData.rideId,
    },
    select: {
      id: true,
      driverId: true,
      rideStatus: true,
    },
  })

  if (!ride) {
    throw new ResponseError(404, 'Ride not found', orderData.rideId)
  }

  if (ride.rideStatus === 2 || ride.rideStatus === 3) {
    throw new ResponseError(400, 'Order cannot be completed')
  }

  const existingOrders = await prismaClient.order.findMany({
    where: { rideId: ride.id },
    select: { status: true },
  })

  if (existingOrders.some(order => ![5, 6, 7].includes(order.status))) {
    throw new ResponseError(
      400,
      'Order cannot be completed due to current status',
      customer.email,
    )
  }

  const airport = await prismaClient.airport.findFirst({
    select: {
      name: true,
      lat: true,
      long: true,
    },
  })

  if (!airport) {
    throw new ResponseError(404, 'Airport not found')
  }

  const fare = await prismaClient.fare.findFirst({
    select: {
      id: true,
      farePerKm: true,
    },
  })

  if (!fare) {
    throw new ResponseError(404, 'Fare information not found')
  }

  const customerToAirportEstimate = await getDirections(
    customer.lat,
    customer.long,
    airport.lat,
    airport.long,
  )

  const driverInfo = await prismaClient.driver.findUnique({
    where: {
      id: ride.driverId,
    },
    select: {
      id: true,
      deviceToken: true,
    },
  })

  const costTravel
    = (customerToAirportEstimate.distance / 1000) * fare.farePerKm
  const roundedCostTravel = Math.round(costTravel / 1000) * 1000
  const roundedFarePerKm = Math.round(fare.farePerKm)

  const formattedFarePerKm = roundedFarePerKm.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const formattedCostTravel = roundedCostTravel.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const generateOrderId = async () => {
    const lastOrder = await prismaClient.order.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    })
    const lastId = lastOrder?.id || 'ORD-000000'
    const sequenceNumber = parseInt(lastId.split('-')[1], 10) || 0
    const newSequenceNumber = sequenceNumber + 1
    return `ORD-${String(newSequenceNumber).padStart(6, '0')}`
  }

  const orderId = await generateOrderId()

  const makeOrder = await prismaClient.order.create({
    data: {
      id: orderId,
      lat: orderData.latitude,
      long: orderData.longitude,
      status: 0,
      customerToAirportDistance: customerToAirportEstimate.distance,
      farePerKm: formattedFarePerKm,
      cost: formattedCostTravel,
      rideId: ride.id,
      driverId: ride.driverId,
      customerId: customer.id,
    },
    select: {
      id: true,
    },
  })

  // Add review after order creation
  await prismaClient.review.create({
    data: {
      customerRating: 0,
      customerReview: 'Tidak Ada Review',
      driverRating: 0,
      driverReview: 'Tidak Ada Review',
      orderId: makeOrder.id,
      customerId: customer.id,
      driverId: driverInfo.id,
    },
  })

  await prismaClient.notification.create({
    data: {
      title: 'Notifikasi Pesanan Masuk',
      content: `Anda memiliki pesanan taksi baru. Silakan buka aplikasi untuk informasi lebih lanjut.`,
      recipientType: 'driver',
      customerId: customer.id,
      driverId: driverInfo.id,
      orderId: makeOrder.id,
    },
  })

  try {
    await sendPushNotification(
      'Notifikasi Pesanan Masuk',
      `Anda memiliki pesanan taksi baru. Silakan buka aplikasi untuk informasi lebih lanjut.`,
      driverInfo.deviceToken,
    )
    logger.info('Success to send notification')
  }
  catch {
    throw new ResponseError(500, 'Failed to send notification')
  }

  return makeOrder
}

async function cancelOrder(customerEmail, orderId) {
  const customer = await prismaClient.customer.findUnique({
    where: { email: customerEmail },
    select: { id: true, deviceToken: true },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer not found', customerEmail)
  }

  const order = await prismaClient.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true, status: true, rideId: true },
  })

  if (!order) {
    throw new ResponseError(404, 'Order not found', orderId)
  }

  if (order.customerId !== customer.id) {
    throw new ResponseError(
      403,
      'Order does not belong to the customer',
      orderId,
    )
  }

  if ([4, 5, 6, 7].includes(order.status)) {
    throw new ResponseError(400, 'Order cannot be cancelled', orderId)
  }

  const ride = await prismaClient.ride.findFirst({
    where: {
      id: order.rideId,
    },
    select: {
      driverId: true,
    },
  })

  if (!ride) {
    throw new ResponseError(404, 'Ride not found', order.rideId)
  }

  const driverInfo = await prismaClient.driver.findUnique({
    where: {
      id: ride.driverId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      noMembership: true,
      licensePlate: true,
      phoneNumber: true,
      photo: true,
      deviceToken: true,
    },
  })

  if (!ride) {
    throw new ResponseError(404, 'Driver not found', ride.driverId)
  }

  const cancelledOrder = await prismaClient.order.update({
    where: { id: orderId },
    data: { status: 5 },
    select: { id: true },
  })

  try {
    await sendPushNotification(
      'Notifikasi Pembatalan Pemesanan',
      `Pemesanan Taksi Bandara telah dibatalkan oleh pelanggan. Silahkan cek halaman riwayat pemesanan untuk informasi lebih detail.`,
      driverInfo.deviceToken,
    )
    logger.info('Success to send notification')
  }
  catch {
    throw new ResponseError(500, 'Failed to send notification')
  }

  await prismaClient.notification.create({
    data: {
      title: 'Notifikasi Pembatalan Pemesanan',
      content: `Pemesanan Taksi Bandara telah dibatalkan oleh pelanggan. Silahkan cek halaman riwayat pemesanan untuk informasi lebih detail.`,
      recipientType: 'driver',
      customerId: customer.id,
      driverId: driverInfo.id,
      orderId: order.id,
    },
  })

  return cancelledOrder
}

async function getCurrentOrder(customerEmail) {
  const customer = await prismaClient.customer.findUnique({
    where: { email: customerEmail },
    select: {
      id: true,
    },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer not found', customerEmail)
  }

  const currentOrder = await prismaClient.order.findFirst({
    where: {
      customerId: customer.id,
      status: {
        in: [0, 1, 2, 3],
      },
    },
    select: {
      id: true,
      lat: true,
      long: true,
      status: true,
      customerToAirportDistance: true,
      farePerKm: true,
      cost: true,
      rideId: true,
      customerId: true,
    },
  })

  if (!currentOrder) {
    throw new ResponseError(404, 'no_current_order', customer.email)
  }

  const ride = await prismaClient.ride.findUnique({
    where: {
      id: currentOrder.rideId,
    },
    select: {
      id: true,
      driverId: true,
      lat: true,
      long: true,
      pickupRadius: true,
      rideStatus: true,
    },
  })

  if (!ride) {
    throw new ResponseError(404, 'Ride not found', currentOrder.rideId)
  }

  const driverInfo = await prismaClient.driver.findUnique({
    where: {
      id: ride.driverId,
    },
    select: {
      id: true,
      noMembership: true,
      licensePlate: true,
      name: true,
      phoneNumber: true,
      photo: true,
      lat: true,
      long: true,
    },
  })

  if (!driverInfo) {
    throw new ResponseError(404, 'Driver not found', ride.driverId)
  }

  // Ambil semua rating dari review yang tidak bernilai 0 berdasarkan id driver
  const reviews = await prismaClient.review.findMany({
    where: {
      driverId: driverInfo.id,
      driverRating: {
        not: 0,
      },
    },
    select: {
      driverRating: true,
    },
  })

  // Hitung rata-rata rating driver
  const averageRating
    = reviews.reduce((sum, review) => sum + review.driverRating, 0)
      / (reviews.length || 1) // Menghindari pembagian dengan 0

  const airport = await prismaClient.airport.findFirst({
    select: {
      name: true,
      lat: true,
      long: true,
    },
  })

  if (!airport) {
    throw new ResponseError(404, 'Airport not found')
  }

  let estimationDurationAndDistance

  // Calculate distance and duration based on status
  if (currentOrder.status === 1) {
    if (ride.status !== 0) {
      // Calculate from driver to current order
      estimationDurationAndDistance = await getDirections(
        driverInfo.lat,
        driverInfo.long,
        currentOrder.lat,
        currentOrder.long,
      )
    }
    else {
      estimationDurationAndDistance = await getDirections(
        driverInfo.lat,
        driverInfo.long,
        currentOrder.lat,
        currentOrder.long,
      )
    }
  }
  else if (currentOrder.status === 2) {
    // Calculate from driver to current order
    estimationDurationAndDistance = await getDirections(
      driverInfo.lat,
      driverInfo.long,
      currentOrder.lat,
      currentOrder.long,
    )
  }
  else if (currentOrder.status === 3) {
    // Calculate from driver to airport
    estimationDurationAndDistance = await getDirections(
      driverInfo.lat,
      driverInfo.long,
      airport.lat,
      airport.long,
    )
  }
  else {
    // Set to 0 for other statuses
    estimationDurationAndDistance = {
      duration: 0,
      distance: 0,
    }
  }

  // Update driver lat and long if status is 0
  if (currentOrder.status === 0) {
    driverInfo.lat = 0
    driverInfo.long = 0
  }

  return {
    ...currentOrder,
    driver: {
      ...driverInfo,
      averageRating: Number.parseFloat(averageRating.toFixed(2)),
    },
    estimationDuration: formattedDuration(
      estimationDurationAndDistance.duration,
    ),
    estimationDistance: formattedDistance(
      estimationDurationAndDistance.distance,
    ),
    rideInfo: ride,
  }
}

async function getHistoryOrder(customerEmail) {
  const customer = await prismaClient.customer.findUnique({
    where: { email: customerEmail },
    select: { id: true },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer not found', customerEmail)
  }

  const orders = await prismaClient.order.findMany({
    where: {
      customerId: customer.id,
      status: {
        in: [4, 5, 6, 7],
      },
    },
    select: {
      id: true,
      lat: true,
      long: true,
      status: true,
      customerToAirportDistance: true,
      farePerKm: true,
      cost: true,
      createDatetime: true,
      updateDatetime: true,
      rideId: true,
      customerId: true,
      driverId: true,
      driver: {
        select: {
          id: true,
          name: true,
          licensePlate: true,
          photo: true,
          lat: true,
          long: true,
        },
      },
    },
  })

  // Get order IDs
  const orderIds = orders.map(order => order.id)

  // Get reviews for the orders
  const reviews = await prismaClient.review.findMany({
    where: {
      orderId: {
        in: orderIds,
      },
    },
    select: {
      id: true,
      orderId: true, // Include orderId to map reviews correctly
      driverRating: true,
      driverReview: true,
    },
  })

  // Create a map of orderId to review
  const reviewMap = reviews.reduce((acc, review) => {
    acc[review.orderId] = review
    return acc
  }, {})

  // Merge orders with reviews
  const formattedOrders = orders.map(order => ({
    ...order,
    review: reviewMap[order.id] || {
      driverReview: 'Tidak Ada Review',
      driverRating: 0,
    },
    createDatetime: format(new Date(order.createDatetime), 'dd-MM-yyyy HH:mm', {
      locale: id,
    }),
    updateDatetime: format(new Date(order.updateDatetime), 'dd-MM-yyyy HH:mm', {
      locale: id,
    }),
  }))

  return formattedOrders
}

async function sendMessage(customerEmail, orderId, message) {
  // Cari customer berdasarkan email
  const customer = await prismaClient.customer.findUnique({
    where: { email: customerEmail },
    select: { id: true },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer not found', customerEmail)
  }

  // Cari order berdasarkan orderId
  const order = await prismaClient.order.findUnique({
    where: { id: orderId },
    select: { id: true, driverId: true, status: true },
  })

  if (!order) {
    throw new ResponseError(404, 'Order not found', orderId)
  }

  // Cari driver berdasarkan driverId dari order
  const driver = await prismaClient.driver.findUnique({
    where: { id: order.driverId },
    select: { id: true, deviceToken: true },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found', order.driverId)
  }

  // Kirim notifikasi push ke driver
  try {
    const notificationTitle = 'Pesan dari Customer'
    const notificationMessage = message

    if (driver && driver.deviceToken) {
      await sendPushNotification(
        notificationTitle,
        notificationMessage,
        driver.deviceToken,
      )
      logger.info('Success to send notification')
    }
  }
  catch (error) {
    console.error('Error sending notification: ', error)
    throw new ResponseError(500, 'Failed to send notification')
  }

  // Buat pesan di tabel Message
  await prismaClient.message.create({
    data: {
      content: message,
      senderType: 'customer',
      customerId: customer.id,
      driverId: driver.id,
      orderId: order.id,
    },
  })

  // Buat notifikasi di tabel Notification
  await prismaClient.notification.create({
    data: {
      title: 'Pesan dari Customer',
      content: message,
      recipientType: 'driver',
      customerId: customer.id,
      driverId: driver.id,
      orderId: order.id,
    },
  })

  return { id: customer.id }
}

async function sendReport(customerEmail, orderId, message) {
  const customer = await prismaClient.customer.findUnique({
    where: { email: customerEmail },
    select: { id: true, email: true, name: true },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer not found', customerEmail)
  }

  const order = await prismaClient.order.findUnique({
    where: { id: orderId },
    select: { id: true, driverId: true, status: true },
  })

  if (!order) {
    throw new ResponseError(404, 'Order not found', orderId)
  }

  const driver = await prismaClient.driver.findUnique({
    where: { id: order.driverId },
    select: { id: true, deviceToken: true, name: true },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found', order.driverId)
  }

  try {
    await sendCustomerReportEmail(
      customer.email,
      customer.name,
      order.id,
      message,
    )
    logger.info('Email sent successfully.')
  }
  catch (error) {
    console.error('Error sending email:', error)
    throw new ResponseError(500, 'Internal Server Error')
  }

  await prismaClient.report.create({
    data: {
      content: message,
      senderType: 'customer',
      customerId: customer.id,
      driverId: driver.id,
      orderId: order.id,
    },
  })

  return { id: customer.id }
}

async function sendReview(customerEmail, orderId, rating, review) {
  const customer = await prismaClient.customer.findUnique({
    where: { email: customerEmail },
    select: { id: true, email: true, name: true },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer not found', customerEmail)
  }

  const order = await prismaClient.order.findUnique({
    where: { id: orderId },
    select: { id: true, driverId: true, status: true },
  })

  if (!order) {
    throw new ResponseError(404, 'Order not found', orderId)
  }

  const existingReview = await prismaClient.review.findFirst({
    where: {
      orderId: order.id,
    },
    select: {
      id: true,
    },
  })

  if (!existingReview) {
    throw new ResponseError(404, 'Existing Review not found', orderId)
  }

  await prismaClient.review.update({
    where: {
      id: existingReview.id,
    },
    data: {
      customerRating: rating,
      customerReview: review?.trim() || 'Tidak Ada Review',
    },
  })

  return { id: customer.id }
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
