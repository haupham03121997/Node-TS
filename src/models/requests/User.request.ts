export interface RegisterRequestBody {
  name: string
  email: string
  password: string
  date_of_birth: string
  confirm_password: string
}

export interface LoginRequestBody {
  email: string
  password: string
}
