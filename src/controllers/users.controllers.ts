import { RequestHandler, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { RegisterRequestBody } from '~/models/requests/User.request'
import { databaseService } from '~/services/config.service'
import { usersService } from '~/services/user.service'
import { wrapRequestHandler } from '~/utils/handlers'

export const loginController: RequestHandler = wrapRequestHandler(async (req: Request, res: Response) => {
  const { user } = req
  const user_id = user?._id as ObjectId
  const result = await usersService.loginService(user_id.toString())
  return res.json({ message: 'Login success!!!', result })
})

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
