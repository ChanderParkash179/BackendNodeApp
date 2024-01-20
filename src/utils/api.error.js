class APIError extends Error {
  constructor(
    code,
    message = process.env.ERROR_MSG,
    errors = [],
    stack = ""
  ) {
    super(message),
      this.code = code,
      this.data = null,
      this.message = message,
      this.errors = errors

    if (stack)
      this.stack = stack
    else
      Error.captureStackTrace(
        this,
        this.constructor
      )
  }
}

export { APIError }