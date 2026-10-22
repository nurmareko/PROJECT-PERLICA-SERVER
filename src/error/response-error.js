class ResponseError extends Error {
  constructor(status, message, additionalData = null) {
    super(message)
    this.status = status
    this.name = 'ResponseError'
    this.additionalData = additionalData
  }
}
export {
  ResponseError,
}
