export enum HttpStatus {
  OK = 200,
  CREATE_SUCCESS = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
  TIME_OUT = 408,
  BAD_GATEWAY = 502,
  GATEWAY_TIMEOUT = 504
  // Bạn có thể thêm các mã HTTP status khác tại đây theo nhu cầu của bạn
}
