import { prismaClient } from '../application/database.js'

export async function authMiddleware(req, res, next) {
  const token = req.get('Authorization')

  if (!token) {
    return res.status(401).json({
      error: {
        status: 401,
        message: 'Unauthorized',
        additionalData: null,
      },
    })
  }

  // Cek apakah token valid untuk pelanggan
  const customer = await prismaClient.customer.findFirst({
    where: {
      token,
    },
  })

  // Jika token valid untuk pelanggan, tambahkan informasi pelanggan ke request dan lanjutkan
  if (customer) {
    if (!customer.status) {
      await prismaClient.customer.update({
        where: {
          id: customer.id,
        },
        data: {
          token: null,
        },
      })
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          additionalData: null,
        },
      })
    }

    // // Tambahkan pengecekan untuk tokenExpiry pada customer
    // if (customer.tokenExpiry && new Date() > customer.tokenExpiry) {
    //   return res.status(401).json({
    //     error: {
    //       status: 401,
    //       message: "Unauthorized",
    //       additionalData: null,
    //     },
    //   });
    // }

    req.customer = customer
    next()
    return
  }

  // Cek apakah token valid untuk pengemudi
  const driver = await prismaClient.driver.findFirst({
    where: {
      token,
    },
  })

  // Jika token valid untuk pengemudi, tambahkan informasi pengemudi ke request dan lanjutkan
  if (driver) {
    if (!driver.status) {
      await prismaClient.driver.update({
        where: {
          id: driver.id,
        },
        data: {
          token: null,
        },
      })
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          additionalData: null,
        },
      })
    }
    // Tambahkan pengecekan untuk tokenExpiry pada driver
    // if (driver.tokenExpiry && new Date() > driver.tokenExpiry) {
    //   return res.status(401).json({
    //     error: {
    //       status: 401,
    //       message: "Unauthorized",
    //       additionalData: null,
    //     },
    //   });
    // }

    req.driver = driver
    next()
    return
  }

  // Cek apakah token valid untuk admin
  const admin = await prismaClient.admin.findFirst({
    where: {
      token,
    },
  })

  if (admin) {
    if (admin.tokenExpiry && new Date() > admin.tokenExpiry) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          additionalData: null,
        },
      })
    }

    req.admin = admin
    next()
    return
  }

  // Jika token tidak valid untuk pelanggan, pengemudi, atau admin, kembalikan respons Unauthorized
  return res.status(401).json({
    error: {
      status: 401,
      message: 'Unauthorized',
      additionalData: null,
    },
  })
}
