class APIResponse {
  constructor(
    code,
    data,
    messsage = process.env.SUCCESS_MSG,
  ) {
    this.code = code,
      this.data = data,
      this.message = messsage,
      this.success = code < 400
  }
}

export { APIResponse }