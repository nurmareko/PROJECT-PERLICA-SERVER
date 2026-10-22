import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { prismaClient } from '../application/database.js'
import { logger } from '../application/logging.js'
import { ResponseError } from '../error/response-error.js'
import { sendDriverReportEmail } from '../utils/sendEmailReport.js'
import sendPushNotification from '../utils/sendPushNotification.js'

async function getCurrentOrderan(driverEmail) {
  const driver = await prismaClient.driver.findUnique({
    where: { email: driverEmail },
    select: {
      id: true,
    },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found', driverEmail)
  }

  const currentOrderan = await prismaClient.order.findFirst({
    where: {
      driverId: driver.id,
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
      driverId: true,
    },
  })

  if (!currentOrderan) {
    throw new ResponseError(404, 'no_current_orderan', driver.email)
  }

  const customerInfo = await prismaClient.customer.findUnique({
    where: {
      id: currentOrderan.customerId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phoneNumber: true,
      photo: true,
    },
  })

  if (!customerInfo) {
    throw new ResponseError(
      404,
      'Customer not found',
      currentOrderan.customerId,
    )
  }

  // Ambil semua rating dari review yang tidak bernilai 0 berdasarkan id customer
  const reviews = await prismaClient.review.findMany({
    where: {
      customerId: customerInfo.id,
      driverRating: {
        not: 0,
      },
    },
    select: {
      customerRating: true,
    },
  })

  // Hitung rata-rata rating customer
  const averageRating
    = reviews.reduce((sum, review) => sum + review.customerRating, 0)
      / (reviews.length || 1) // Menghindari pembagian dengan 0

  const rideInfo = await prismaClient.ride.findUnique({
    where: {
      id: currentOrderan.rideId,
    },
    select: {
      id: true,
      lat: true,
      long: true,
      rideStatus: true,
      pickupRadius: true,
      driverId: true,
    },
  })

  if (!rideInfo) {
    throw new ResponseError(404, 'Ride not found', currentOrderan.rideId)
  }

  // Tambahkan averageRating ke dalam customerInfo
  const enrichedCustomerInfo = { ...customerInfo, averageRating }

  return { ...currentOrderan, customer: enrichedCustomerInfo, ride: rideInfo }
}

async function rejectOrderan(driverEmail, orderId) {
  const driver = await prismaClient.driver.findUnique({
    where: { email: driverEmail },
    select: { id: true },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found', driverEmail)
  }

  const order = await prismaClient.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true, status: true },
  })

  if (!order) {
    throw new ResponseError(404, 'Order not found', orderId)
  }

  if (order.status !== 0) {
    throw new ResponseError(400, 'Order cannot be rejected', order.id)
  }

  const customer = await prismaClient.customer.findUnique({
    where: { id: order.customerId },
    select: { id: true, deviceToken: true },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer not found', order.customerId)
  }

  const rejectedOrderan = await prismaClient.order.update({
    where: { id: orderId, driverId: driver.id },
    data: { status: 7 },
    select: { driverId: true },
  })

  try {
    await sendPushNotification(
      'Pesanan Taxi Anda Ditolak oleh Driver',
      'Pesanan Taxi Anda telah ditolak oleh Driver. Silakan mencari Driver lain yang tersedia. Terima kasih telah menggunakan layanan kami!',
      customer.deviceToken,
    )
    logger.info('Order rejection notification sent', { orderId })
  }
  catch (error) {
    console.error('Error sending notification: ', error)
    throw new ResponseError(500, 'Failed to send notification')
  }

  return rejectedOrderan
}

async function acceptOrderan(driverEmail, orderId) {
  const driver = await prismaClient.driver.findUnique({
    where: { email: driverEmail },
    select: { id: true },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found', driverEmail)
  }

  const order = await prismaClient.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true, status: true },
  })

  if (!order) {
    throw new ResponseError(404, 'Order not found', orderId)
  }

  if (order.status !== 0) {
    throw new ResponseError(400, 'Order cannot be accepted', orderId)
  }

  const customer = await prismaClient.customer.findUnique({
    where: { id: order.customerId },
    select: { id: true, deviceToken: true },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer not found', order.customerId)
  }

  const acceptedOrderan = await prismaClient.order.update({
    where: { id: orderId, driverId: driver.id },
    data: { status: 1 },
    select: { driverId: true },
  })

  try {
    await sendPushNotification(
      'Pesanan Taxi Anda Diterima oleh Driver',
      'Pesanan Taxi Anda telah diterima oleh driver. Silahkan pergi ke halaman pesanan untuk melihat informasi detail dan pembaruan informasi pemesanan.',
      customer.deviceToken,
    )
    logger.info('Order acceptance notification sent', { orderId })
  }
  catch (error) {
    console.error('Error sending notification: ', error)
    throw new ResponseError(500, 'Failed to send notification')
  }

  return acceptedOrderan
}

async function cancelOrderan(driverEmail, orderId) {
  const driver = await prismaClient.driver.findUnique({
    where: { email: driverEmail },
    select: { id: true },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found', driverEmail)
  }

  const order = await prismaClient.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true, status: true },
  })

  if (!order) {
    throw new ResponseError(404, 'Order not found', orderId)
  }

  if (![1, 2, 3].includes(order.status)) {
    throw new ResponseError(400, 'Order cannot be cancelled', orderId)
  }

  const customer = await prismaClient.customer.findUnique({
    where: { id: order.customerId },
    select: { id: true, deviceToken: true },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer not found', order.customerId)
  }

  const cancelledOrderan = await prismaClient.order.update({
    where: { id: orderId, driverId: driver.id },
    data: { status: 6 },
    select: { driverId: true },
  })

  try {
    await sendPushNotification(
      'Pesanan Taxi Anda Dibatalkan oleh Driver',
      'Pesanan Taxi Anda telah dibatalkan oleh Driver. Silahkan cek halaman riwayat untuk informasi lebih detail. ',
      customer.deviceToken,
    )
    logger.info('Order cancellation notification sent', { orderId })
  }
  catch (error) {
    console.error('Error sending notification: ', error)
    throw new ResponseError(500, 'Failed to send notification')
  }

  return cancelledOrderan
}

async function getHistoryOrderan(driverEmail) {
  const driver = await prismaClient.driver.findUnique({
    where: { email: driverEmail },
    select: {
      id: true,
    },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found', driverEmail)
  }

  const orders = await prismaClient.order.findMany({
    where: {
      driverId: driver.id,
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
      customer: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          photo: true,
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
      customerRating: true,
      customerReview: true,
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
      customerReview: 'Tidak Ada Review',
      customerRating: 0,
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

async function updateStatusOrderan(driverEmail, orderId, orderStatus) {
  const driver = await prismaClient.driver.findUnique({
    where: { email: driverEmail },
    select: { id: true, deviceToken: true },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found', driverEmail)
  }

  const order = await prismaClient.order.findUnique({
    where: { id: orderId, driverId: driver.id },
    select: { id: true, customerId: true, status: true },
  })

  if (!order) {
    throw new ResponseError(404, 'Order not found', orderId)
  }

  // Cek jika status orderan adalah 1, 2, atau 3
  if (![1, 2, 3].includes(order.status)) {
    throw new ResponseError(
      400,
      'Order cannot be updated due to its current status',
      orderId,
    )
  }

  const updatedOrderan = await prismaClient.order.update({
    where: { id: orderId },
    data: { status: orderStatus },
    select: { driverId: true, cost: true },
  })

  try {
    let notificationTitle = ''
    let notificationMessage = ''

    if (orderStatus === 2) {
      notificationTitle = 'Driver sedang menjemput penumpang'
      notificationMessage = 'Driver sedang dalam perjalanan menjemput Anda.'
    }
    else if (orderStatus === 3) {
      notificationTitle = 'Driver menuju bandara'
      notificationMessage = 'Driver sedang dalam perjalanan menuju bandara.'
    }
    else if (orderStatus === 4) {
      notificationTitle = 'Perjalanan selesai'
      notificationMessage
        = 'Perjalanan Anda telah selesai. Terima kasih telah menggunakan layanan kami.'

      // await prismaClient.review.create({
      //   data: {
      //     orderId: order.id,
      //     customerRating: 0,
      //     customerReview: "Tidak Ada Review",
      //     driverRating: 0,
      //     driverReview: "Tidak Ada Review",
      //   },
      // });

      // Kirim notifikasi ke driver
      if (driver.deviceToken) {
        await sendPushNotification(
          'Perjalanan selesai',
          'Perjalanan Anda telah selesai, silahkan cek halaman riwayat untuk melihat informasi detail.',
          driver.deviceToken,
          { orderId },
        )
        logger.info('Order status notification sent to driver', { orderId })
      }
    }

    const customer = await prismaClient.customer.findUnique({
      where: { id: order.customerId },
      select: { deviceToken: true },
    })

    const estimatedCost = updatedOrderan.cost

    if (customer && customer.deviceToken) {
      await sendPushNotification(
        notificationTitle,
        notificationMessage,
        customer.deviceToken,
        { orderId, estimatedCost },
      )
      logger.info('Order status notification sent to customer', { orderId })
    }
  }
  catch (error) {
    console.error('Error sending notification: ', error)
    throw new ResponseError(500, 'Failed to send notification')
  }

  return updatedOrderan
}

async function updateLocationOrderan(driverEmail, requestData) {
  const driver = await prismaClient.driver.findUnique({
    where: { email: driverEmail },
    select: { id: true },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found', driverEmail)
  }

  const updatedDriverPosition = await prismaClient.driver.update({
    where: { id: driver.id },
    data: {
      lat: requestData.latitude,
      long: requestData.longitude,
    },
    select: { id: true, lat: true, long: true },
  })

  const orders = await prismaClient.order.findMany({
    where: { driverId: driver.id },
    select: { id: true, customerId: true, status: true },
  })

  const ordersToNotify = orders.filter(order =>
    [1, 2, 3].includes(order.status),
  )

  if (ordersToNotify.length > 0) {
    try {
      const notificationTitle = 'update-latlng'
      const notificationMessage = `${requestData.latitude}, ${requestData.latitude}`

      const driverLat = requestData.latitude
      const driverLong = requestData.longitude

      for (const order of ordersToNotify) {
        const customer = await prismaClient.customer.findUnique({
          where: { id: order.customerId },
          select: { deviceToken: true },
        })

        if (customer?.deviceToken) {
          await sendPushNotification(
            notificationTitle,
            notificationMessage,
            customer.deviceToken,
            { driverLat, driverLong },
          )
          logger.info('Location notification sent for order', { orderId: order.id })
        }
      }
    }
    catch (error) {
      console.error('Error sending notifications: ', error)
      throw new ResponseError(500, 'Failed to send notifications')
    }
  }

  return updatedDriverPosition
}

async function sendMessage(driverEmail, orderId, message) {
  const driver = await prismaClient.driver.findUnique({
    where: { email: driverEmail },
    select: { id: true },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found', driverEmail)
  }

  const order = await prismaClient.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true, status: true },
  })

  if (!order) {
    throw new ResponseError(404, 'Order not found', orderId)
  }

  const customer = await prismaClient.customer.findUnique({
    where: { id: order.customerId },
    select: { id: true, deviceToken: true },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer not found', order.customerId)
  }

  try {
    const notificationTitle = 'Pesan dari Driver'
    const notificationMessage = message

    if (customer && customer.deviceToken) {
      await sendPushNotification(
        notificationTitle,
        notificationMessage,
        customer.deviceToken,
      )
      logger.info('Driver message notification sent', { orderId })
    }
  }
  catch (error) {
    console.error('Error sending notification: ', error)
    throw new ResponseError(500, 'Failed to send notification')
  }
  return driver
}

async function sendReport(driverEmail, orderId, message) {
  const driver = await prismaClient.driver.findUnique({
    where: { email: driverEmail },
    select: { id: true, email: true, name: true },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found', driverEmail)
  }

  const order = await prismaClient.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true, status: true },
  })

  if (!order) {
    throw new ResponseError(404, 'Order not found', orderId)
  }

  const customer = await prismaClient.customer.findUnique({
    where: { id: order.customerId },
    select: { id: true, name: true },
  })

  if (!customer) {
    throw new ResponseError(404, 'Customer not found', order.customerId)
  }

  try {
    await sendDriverReportEmail(driver.email, driver.name, order.id, message)
    logger.info('Driver report email sent successfully', { orderId })
  }
  catch (error) {
    console.error('Error sending email:', error)
    throw new ResponseError(500, 'Internal Server Error')
  }

  return { id: driver.id }
}

async function sendReview(driverEmail, orderId, rating, review) {
  const driver = await prismaClient.driver.findUnique({
    where: { email: driverEmail },
    select: { id: true, email: true, name: true },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found', driverEmail)
  }

  const order = await prismaClient.order.findUnique({
    where: { id: orderId },
    select: { id: true, driverId: true, status: true },
  })

  if (!order) {
    throw new ResponseError(404, 'Order not found', orderId)
  }

  if (order.driverId !== driver.id) {
    throw new ResponseError(
      403,
      'Driver not associated with this order',
      orderId,
    )
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
      driverRating: rating,
      driverReview: review?.trim() || 'Tidak Ada Review',
    },
  })

  return { id: 2 }
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
