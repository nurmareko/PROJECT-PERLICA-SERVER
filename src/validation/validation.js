import { ResponseError } from '../error/response-error.js'

function validate(schema, request) {
  const result = schema.validate(request, {
    abortEarly: false,
    allowUnknown: false,
  })
  if (result.error) {
    throw new ResponseError(400, result.error.message, null)
  }
  else {
    return result.value
  }
}

export {
  validate,
}
