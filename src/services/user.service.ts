import User from '~/models/schemas/User.schema'
import { databaseService } from './config.service'
import { RegisterRequestBody } from '~/models/requests/User.request'
import { sha256 } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenTypes } from '~/constants/enums'
import { ObjectId } from 'mongodb'
import { RefreshToken } from '~/models/schemas/RefreshToken.scheme'

import { config } from 'dotenv'

config()
class UsersService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenTypes.AccessToken },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenTypes.RefreshToken },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }

  async registerService(payload: RegisterRequestBody) {
    const result = await databaseService.users.insertOne(
      new User({ ...payload, date_of_birth: new Date(payload.date_of_birth), password: sha256(payload.password) })
    )
    const user_id = result.insertedId.toString()
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    databaseService.refreshToken.insertOne(new RefreshToken({ id: new ObjectId(), user_id, token: refresh_token }))
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
}

const usersService = new UsersService()

export { usersService }
