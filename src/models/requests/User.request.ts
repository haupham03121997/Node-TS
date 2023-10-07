import { JwtPayload } from 'jsonwebtoken'
import { TokenTypes, UserVerifyStatus } from '~/constants/enums'

export interface LoginRequestBody {
  email: string
  password: string
}
export interface RegisterRequestBody {
  name: string
  email: string
  password: string
  date_of_birth: string
  confirm_password: string
}

export interface VerifyEmailRequestBody {
  email_verify_token: string
}

export interface ForgotPasswordRequestBody {
  email_verify_token: string
}
export interface VerifyEmail {
  email: string
  password: string
}

export interface ForgotPasswordRedBody {
  email: string
}
export interface TokenPayload extends JwtPayload {
  user_id?: string
  token_type?: TokenTypes
  verify?: UserVerifyStatus
  exp?: number
  iat?: number
}
