import { config } from 'dotenv'
import { RequestHandler, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { pick } from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import { HttpStatus } from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import {
  ChangePasswordRequestBody,
  FollowRequestBody,
  ForgotPasswordRedBody,
  GetProfileRequestParam,
  LoginRequestBody,
  RegisterRequestBody,
  ResetPasswordRequestBody,
  TokenPayload,
  UnFollowRequestParam,
  UpdateMeRequestBody,
  VerifyEmailRequestBody
} from '~/models/requests/User.request'
import User from '~/models/schemas/User.schema'
import { databaseService } from '~/services/config.service'
import { usersService } from '~/services/user.service'
import { wrapRequestHandler } from '~/utils/handlers'

config()

export const loginController: RequestHandler = wrapRequestHandler(
  async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
    const { user } = req
    const user_id = user?._id as ObjectId
    const result = await usersService.loginService({
      user_id: user_id.toString(),
      verify: user?.verify as UserVerifyStatus
    })
    return res.json({ message: 'Login success!!!', result })
  }
)
export const oauthController: RequestHandler = wrapRequestHandler(
  async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
    const { code } = req.query

    const result = await usersService.oauth(code as string)
    const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&new_user=${result.newUser}`
    console.log('result', urlRedirect)
    return res.redirect(urlRedirect)
  }
)

export const registerController: RequestHandler = wrapRequestHandler(
  async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res) => {
    try {
      const result = await usersService.registerService(req.body)
      return res.status(200).json({ message: 'Register successfully!!!', result })
    } catch (error) {
      return res.status(500).json({ message: (error as any).message })
    }
  }
)

export const logoutController: RequestHandler = wrapRequestHandler(async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  const result = await usersService.logoutService(refresh_token)
  return res.json(result)
})

export const emailVerifyController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, any, VerifyEmailRequestBody>, res: Response) => {
    const email_verify_token = req.body.email_verify_token
    const user = await databaseService.users.findOne({ email_verify_token })
    if (!user) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: USERS_MESSAGES.USER_NOT_FOUND })
    }
    if (user?.email_verify_token === '') {
      return res.json({ message: USERS_MESSAGES.EMAIL_ALREADY_VERIFY_BEFORE })
    }
    const user_id = user?._id.toString()
    const result = await usersService.verifyEmail(user_id as string)
    return res.json({ message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS, result })
  }
)

export const resendVerifyEmailController = wrapRequestHandler(async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload

  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: USERS_MESSAGES.USER_NOT_FOUND })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({ message: USERS_MESSAGES.EMAIL_ALREADY_VERIFY_BEFORE })
  }
  const result = await usersService.resendVerifyEmail(user_id as string)
  return res.json(result)
})

export const forgotPasswordController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, any, ForgotPasswordRedBody>, res: Response) => {
    const { _id } = req.user as User
    const result = await usersService.forgotPassword({
      user_id: (_id as ObjectId).toString(),
      verify: req.user?.verify as UserVerifyStatus
    })
    return res.json(result)
  }
)

export const verifyForgotPasswordTokenController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, any, ForgotPasswordRedBody>, res: Response) => {
    return res.json({ message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS })
  }
)

export const resetPasswordController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, any, ResetPasswordRequestBody>, res: Response) => {
    const { user_id } = req.decode_forgot_password_token as TokenPayload
    const { password } = req.body
    await usersService.resetPassword(user_id as string, password)
    return res.json({ message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS })
  }
)

export const getMeController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, any, ResetPasswordRequestBody>, res: Response) => {
    const { user_id } = req.decode_authorization as TokenPayload
    const result = await usersService.getMe(user_id as string)
    if (!result) {
      return res.json({ message: USERS_MESSAGES.USER_NOT_FOUND })
    }
    return res.json({ message: USERS_MESSAGES.GET_USER_SUCCESS, result })
  }
)

export const updateMeProfileController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, any, UpdateMeRequestBody>, res: Response) => {
    const { user_id } = req.decode_authorization as TokenPayload
    const body = pick(
      req.body,
      'name',
      'avatar',
      'date_of_birth',
      'location',
      'website',
      'bio',
      'cover_photo',
      'username'
    )
    const result = await usersService.updateMe(user_id as string, body)
    return res.json({ message: USERS_MESSAGES.UPDATE_USER_SUCCESS, result })
  }
)

export const getProfileController = wrapRequestHandler(async (req: Request<GetProfileRequestParam>, res: Response) => {
  const { username } = req.params
  const result = await usersService.getProfile(username)
  return res.json({ message: USERS_MESSAGES.GET_PROFILE_SUCCESS, result })
})

export const followController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, any, FollowRequestBody>, res: Response) => {
    const { user_id } = req.decode_authorization as TokenPayload
    const { followed_user_id } = req.body
    const result = await usersService.followers(user_id as string, followed_user_id)
    return res.json({ message: USERS_MESSAGES.FOLLOW_SUCCESS, result })
  }
)

export const unFollowController = wrapRequestHandler(async (req: Request<UnFollowRequestParam>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const { user_id: followed_user_id } = req.params
  const result = await usersService.unfollow(user_id as string, followed_user_id)
  return res.json(result)
})

export const changePasswordController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, any, ChangePasswordRequestBody>, res: Response) => {
    const { user_id } = req.decode_authorization as TokenPayload
    const { password } = req.body
    const result = await usersService.changePassword(user_id as string, password)
    return res.json(result)
  }
)
