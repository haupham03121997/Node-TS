import { JwtPayload } from 'jsonwebtoken'
import { TokenTypes, UserVerifyStatus } from '~/constants/enums'
import { ParamsDictionary } from 'express-serve-static-core'

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

export interface ResetPasswordRequestBody {
  password: string
  forgot_password_token: string
  confirm_password: string
}
export interface ForgotPasswordRequestBody {
  email_verify_token: string
}

export interface UpdateMeRequestBody {
  name?: string
  date_of_birth?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  bio?: string
  cover_photo?: string
}

export interface GetProfileRequestParam {
  username: string
}

export interface VerifyEmail {
  email: string
  password: string
}

export interface ForgotPasswordRedBody {
  email: string
}

export interface FollowRequestBody {
  user_id: string
  followed_user_id: string
}

export interface ChangePasswordRequestBody {
  old_password: string
  password: string
  confirm_password: string
}
export interface UnFollowRequestParam extends ParamsDictionary {
  user_id: string
}

export interface TokenPayload extends JwtPayload {
  user_id?: string
  token_type?: TokenTypes
  verify?: UserVerifyStatus
  exp?: number
  iat?: number
}
