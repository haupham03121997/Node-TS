import { RequestHandler, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import { HttpStatus } from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import {
  ForgotPasswordRedBody,
  LoginRequestBody,
  RegisterRequestBody,
  TokenPayload,
  VerifyEmailRequestBody
} from '~/models/requests/User.request'
import User from '~/models/schemas/User.schema'
import { databaseService } from '~/services/config.service'
import { usersService } from '~/services/user.service'
import { wrapRequestHandler } from '~/utils/handlers'

export const loginController: RequestHandler = wrapRequestHandler(
  async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
    const { user } = req
    const user_id = user?._id as ObjectId
    const result = await usersService.loginService(user_id.toString())
    return res.json({ message: 'Login success!!!', result })
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
    const result = await usersService.forgotPassword((_id as ObjectId).toString())
    return res.json(result)
  }
)

export const verifyForgotPasswordTokenController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, any, ForgotPasswordRedBody>, res: Response) => {
    return res.json({ message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS })
  }
)
