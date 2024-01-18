class APIError extends Error {
  constructor(
    code,
    message = process.env.ERROR_MSG,
    errors = [],
    statck = ""
  ) {
    super(code, message),
      this.code = code,
      this.data = null,
      this.message = message,
      this.errors = errors

    if (statck)
      this.stack = statck
    else
      Error.captureStackTrace(
        this,
        this.constructor
      )
  }
}

export { APIError }