type ErrorsType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
> // [key :string] : string
export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

export class ErrorEntity extends ErrorWithStatus {
  errors: ErrorsType
  constructor({ message = 'Validation Error', errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: 422 })
    this.errors = errors
  }
}
