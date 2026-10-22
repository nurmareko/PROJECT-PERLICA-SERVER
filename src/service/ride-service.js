import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { prismaClient } from '../application/database.js'
import { ResponseError } from '../error/response-error.js'

async function getCurrentRide(email) {
  // Mencari driver berdasarkan email
  const driver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  })

  // Jika driver tidak ditemukan, lemparkan error
  if (!driver) {
    throw new ResponseError(404, 'Driver not found', email)
  }

  // Mencari ride berdasarkan driverId dan rideStatus = 0
  const ride = await prismaClient.ride.findFirst({
    where: {
      driverId: driver.id,
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
      createDatetime: true,
      updateDatetime: true,
    },
  })

  // Jika ride tidak ditemukan, lemparkan error
  if (!ride) {
    throw new ResponseError(404, 'no_current_ride')
  }

  // Format createDatetime dan updateDatetime
  ride.createDatetime = ride.createDatetime
    ? format(new Date(ride.createDatetime), 'dd-MM-yyyy HH:mm', { locale: id })
    : '' // Format hanya jika ada
  ride.updateDatetime = format(new Date(), 'dd-MM-yyyy HH:mm', { locale: id }) // Format waktu sekarang

  return ride
}

async function addRide(email, rideData) {
  const driver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found')
  }

  const existingOrders = await prismaClient.order.findMany({
    where: {
      driverId: driver.id,
      status: {
        in: [0, 1, 2, 3],
      },
    },
    select: {
      status: true,
    },
  })

  // Check if there are existing orders with the specified statuses
  if (existingOrders.length > 0) {
    throw new ResponseError(
      400,
      'Cannot add new ride: existing order status is 0, 1, 2, or 3',
    )
  }

  const existingRide = await prismaClient.ride.findFirst({
    where: {
      driverId: driver.id,
      rideStatus: {
        in: [0, 1],
      },
    },
  })

  if (existingRide) {
    throw new ResponseError(400, 'Ada pengantaran yang belum selesai')
  }

  // Function to generate a new ride ID
  const generateRideId = async () => {
    const lastRide = await prismaClient.ride.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    })
    const lastId = lastRide?.id || 'RID-000000'
    const sequenceNumber = parseInt(lastId.split('-')[1], 10) || 0
    const newSequenceNumber = sequenceNumber + 1
    return `RID-${String(newSequenceNumber).padStart(6, '0')}`
  }

  const rideId = await generateRideId()

  rideData.id = rideId // Use the custom ID
  rideData.driverId = driver.id
  rideData.rideStatus = 0

  return await prismaClient.ride.create({
    data: rideData,
    select: {
      id: true,
      driverId: true,
    },
  })
}

async function completeRide(email, rideId) {
  const driver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found')
  }

  const ride = await prismaClient.ride.findUnique({
    where: {
      id: rideId,
    },
    select: {
      id: true,
      lat: true,
      long: true,
      rideStatus: true,
      pickupRadius: true,
    },
  })

  if (!ride) {
    throw new ResponseError(404, 'Ride not found')
  }

  // Check if there's an order with the rideId and status 0, 1, 2, or 3
  // const order = await prismaClient.order.findFirst({
  //   where: {
  //     rideId: rideId,
  //     status: {
  //       in: [0, 1, 2, 3],
  //     },
  //   },
  //   select: {
  //     id: true,
  //     customerId: true,
  //   },
  // });

  // if (order) {
  //   // Retrieve the customer device token
  //   const customer = await prismaClient.customer.findUnique({
  //     where: {
  //       id: order.customerId,
  //     },
  //     select: {
  //       deviceToken: true,
  //     },
  //   });
  // }

  // Update the ride status to completed
  const completedRide = await prismaClient.ride.update({
    where: {
      id: rideId,
    },
    data: {
      rideStatus: 1,
    },
    select: {
      driverId: true,
    },
  })

  return completedRide
}

async function completeAndCloseRide(email, rideId) {
  const driver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found')
  }

  const ride = await prismaClient.ride.findUnique({
    where: {
      id: rideId,
    },
    select: {
      id: true,
      lat: true,
      long: true,
      rideStatus: true,
      pickupRadius: true,
    },
  })

  if (!ride) {
    throw new ResponseError(404, 'Ride not found')
  }

  if (ride.rideStatus !== 1) {
    throw new ResponseError(400, 'Ride cannot be complated and closed')
  }

  // Check if there's an order with the rideId and status 0, 1, 2, or 3
  // const order = await prismaClient.order.findFirst({
  //   where: {
  //     rideId: rideId,
  //     status: {
  //       in: [0, 1, 2, 3],
  //     },
  //   },
  //   select: {
  //     id: true,
  //     customerId: true,
  //   },
  // });

  // if (order) {
  //   // Retrieve the customer device token
  //   const customer = await prismaClient.customer.findUnique({
  //     where: {
  //       id: order.customerId,
  //     },
  //     select: {
  //       deviceToken: true,
  //     },
  //   });
  // }

  // Update the ride status to completed
  const completedAndCloseRide = await prismaClient.ride.update({
    where: {
      id: rideId,
    },
    data: {
      rideStatus: 3,
    },
    select: {
      driverId: true,
    },
  })

  return completedAndCloseRide
}

async function cancelRide(email, rideId) {
  const driver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found')
  }

  const ride = await prismaClient.ride.findUnique({
    where: {
      id: rideId,
    },
    select: {
      id: true,
      lat: true,
      long: true,
      rideStatus: true,
      pickupRadius: true,
    },
  })

  if (!ride) {
    throw new ResponseError(404, 'Ride not found')
  }

  if (ride.rideStatus !== 0) {
    throw new ResponseError(400, 'Ride cannot be cancelled')
  }

  // Check if there's an order with the rideId and status 0, 1, 2, or 3
  // const order = await prismaClient.order.findFirst({
  //   where: {
  //     rideId: rideId,
  //     status: {
  //       in: [0, 1, 2, 3],
  //     },
  //   },
  //   select: {
  //     id: true,
  //     customerId: true,
  //   },
  // });

  // if (order) {
  //   // Retrieve the customer device token
  //   const customer = await prismaClient.customer.findUnique({
  //     where: {
  //       id: order.customerId,
  //     },
  //     select: {
  //       deviceToken: true,
  //     },
  //   });
  // }

  // Update the ride status to cancelled
  const cancelledRide = await prismaClient.ride.update({
    where: {
      id: rideId,
    },
    data: {
      rideStatus: 2,
    },
    select: {
      driverId: true,
    },
  })

  return cancelledRide
}

async function getHistoryRide(email) {
  const driver = await prismaClient.driver.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  })

  if (!driver) {
    throw new ResponseError(404, 'Driver not found', email)
  }

  const rides = await prismaClient.ride.findMany({
    where: {
      driverId: driver.id,
      rideStatus: {
        in: [2, 3],
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
    },
  })

  const formattedRides = rides.map(ride => ({
    ...ride,
    createDatetime: format(new Date(ride.createDatetime), 'dd-MM-yyyy HH:mm', {
      locale: id,
    }),
    updateDatetime: format(new Date(ride.updateDatetime), 'dd-MM-yyyy HH:mm', {
      locale: id,
    }),
  }))

  return formattedRides
}

export default {
  getCurrentRide,
  addRide,
  completeRide,
  completeAndCloseRide,
  cancelRide,
  getHistoryRide,
}
