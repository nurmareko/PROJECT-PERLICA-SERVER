import { ResponseError } from '../error/response-error.js'

async function errorMiddleware(err, req, res, next) {
  if (!err) {
    next()
    return
  }
  if (err instanceof ResponseError) {
    res
      .status(err.status)
      .json({
        error: {
          status: err.status,
          message: err.message,
          additionalData: err.additionalData,
        },
      })
      .end()
  }
  else {
    res
      .status(500)
      .json({
        error: {
          status: 500,
          message: err.message,
          additionalData: null,
        },
      })
      .end()
  }
}

export { errorMiddleware }
