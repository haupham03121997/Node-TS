import User from '~/models/schemas/User.schema'
import { databaseService } from './config.service'
import { RegisterRequestBody } from '~/models/requests/User.request'
import { sha256 } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenTypes, UserVerifyStatus } from '~/constants/enums'
import { ObjectId } from 'mongodb'
import { RefreshToken } from '~/models/schemas/RefreshToken.scheme'

import { config } from 'dotenv'
import { USERS_MESSAGES } from '~/constants/messages'

config()
class UsersService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenTypes.AccessToken },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenTypes.RefreshToken },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  private signEmailToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenTypes.EmailVerifyToken },
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      },
      privateKey: process.env.JWT_SECRET_VERIFY_EMAIL_TOKEN as string
    })
  }

  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }

  private signPasswordToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenTypes.ForgotPasswordToken },
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
    })
  }

  async registerService(payload: RegisterRequestBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailToken(user_id.toString())
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: sha256(payload.password)
      })
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id.toString())
    databaseService.refreshToken.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id).toString(), token: refresh_token })
    )
    return { access_token, refresh_token }
  }

  async checkEmailExist(payload: string) {
    const user = await databaseService.users.findOne({ email: payload })
    return Boolean(user)
  }

  async loginService(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    databaseService.refreshToken.insertOne(new RefreshToken({ id: new ObjectId(), user_id, token: refresh_token }))
    return { access_token, refresh_token }
  }

  async logoutService(refresh_token: string) {
    const result = await databaseService.refreshToken.deleteOne({ token: refresh_token })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken(user_id),
      databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
        {
          $set: {
            email_verify_token: '',
            updated_at: '$$NOW',
            verify: UserVerifyStatus.Verified
          }
          // $currentDate: {
          //   updated_at: true // Sẽ lấy thời gian cập nhật dựa vào mongoDB, Thời gian này sẽ được mongoDB cập nhật tại thời điểm được lưu lên server
          // }
        }
      ])
    ])
    const [access_token, refresh_token] = token

    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailToken(user_id)
    console.log('Gửi email', email_verify_token)
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token,
          updated_at: '$$NOW'
        }
      }
    ])
    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }

  async forgotPassword(user_id: string) {
    const forgot_password_token = await this.signPasswordToken(user_id)
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token,
          updated_at: '$$NOW',
          verify: UserVerifyStatus.Verified
        }
      }
    ])
    // gửi email kèm đường link đến người dùng https://abc.com/forgot-passowrd?token=token
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }
}

const usersService = new UsersService()

export { usersService }
