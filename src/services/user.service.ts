import axios from 'axios'
import User from '~/models/schemas/User.schema'
import { databaseService } from './config.service'
import { RegisterRequestBody, UpdateMeRequestBody } from '~/models/requests/User.request'
import { sha256 } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenTypes, UserVerifyStatus } from '~/constants/enums'
import { ObjectId } from 'mongodb'
import { RefreshToken } from '~/models/schemas/RefreshToken.scheme'

import { config } from 'dotenv'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Error'
import { HttpStatus } from '~/constants/httpStatus'
import { Follower } from '~/models/schemas/Follow.schema'

const projection = { password: 0, email_verify_token: 0, forgot_password_token: 0 }
config()
class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenTypes.AccessToken, verify },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }
  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenTypes.RefreshToken },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  private signEmailToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenTypes.EmailVerifyToken },
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      },
      privateKey: process.env.JWT_SECRET_VERIFY_EMAIL_TOKEN as string
    })
  }

  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  private signPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenTypes.ForgotPasswordToken, verify },
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
    })
  }

  async registerService(payload: RegisterRequestBody) {
    const user_id = new ObjectId()

    const email_verify_token = await this.signEmailToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: sha256(payload.password)
      })
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    databaseService.refreshToken.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id).toString(), token: refresh_token, created_at: new Date() })
    )
    return { access_token, refresh_token }
  }

  async checkEmailExist(payload: string) {
    const user = await databaseService.users.findOne({ email: payload })
    return Boolean(user)
  }

  async loginService({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify })
    databaseService.refreshToken.insertOne(new RefreshToken({ id: new ObjectId(), user_id, token: refresh_token }))
    return { access_token, refresh_token }
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOLE_CLIENT_ID,
      client_secret: process.env.GOOLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOLE_REDIRECT_URI,
      grant_type: 'authorization_code',
      access_type: 'offline'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as { access_token: string; id_token: string }
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  async oauth(code: string) {
    const { access_token, id_token } = await this.getOauthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({ status: HttpStatus.BAD_REQUEST, message: USERS_MESSAGES.GMAIL_IS_NOT_VERIFY })
    }

    const user = await databaseService.users.findOne({ email: userInfo.email })
    // Nếu tồn tại cho login vào
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      })
      await databaseService.refreshToken.insertOne({ user_id: user._id.toString(), token: refresh_token })
      return { access_token, refresh_token, newUser: false }
    } else {
      // Đăng ký user mới
      const password = Math.random().toString(30).substring(2, 15)
      const data = await this.registerService({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password,
        confirm_password: password
      })

      return { ...data, newUser: true }
    }
  }

  async logoutService(refresh_token: string) {
    const result = await databaseService.refreshToken.deleteOne({ token: refresh_token })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
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
    const email_verify_token = await this.signEmailToken({ user_id, verify: UserVerifyStatus.Unverified })
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

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signPasswordToken({ user_id, verify })
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

  async resetPassword(user_id: string, password: string) {
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token: '',
          password: sha256(password),
          updated_at: '$$NOW'
        }
      }
    ])
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection
      }
    )
    return user
  }

  async updateMe(user_id: string, payload: UpdateMeRequestBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: { ...(_payload as UpdateMeRequestBody & { date_of_birth: Date }) },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection
      }
    )
    return user
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne({ username }, { projection })
    if (!user) {
      throw new ErrorWithStatus({ status: HttpStatus.NOT_FOUND, message: USERS_MESSAGES.USER_NOT_FOUND })
    }
    return user
  }

  async followers(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (!follower) {
      await databaseService.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      )
      return { message: USERS_MESSAGES.FOLLOW_SUCCESS }
    }

    return { message: USERS_MESSAGES.FOLLOWED }
  }

  async unfollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (follower === null) {
      return { message: USERS_MESSAGES.ALREADY_UNFOLLOW }
    }

    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    return { message: USERS_MESSAGES.UNFOLLOW_SUCCESS }
  }

  async changePassword(user_id: string, password: string) {
    databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: sha256(password),
          updated_at: '$$NOW'
        }
      }
    ])
    return { message: USERS_MESSAGES.CHANGED_PASSWORD_SUCCESS }
  }
}

const usersService = new UsersService()

export { usersService }
