import { RequestHandler, Request } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterRequestBody } from '~/models/requests/User.request'
import { usersService } from '~/services/user.service'

export const loginController: RequestHandler = (req: Request<ParamsDictionary, any, RegisterRequestBody>, res) => {
  const { email, password, confirm_password } = req.body
  if (email === 'haupham0312@gmail.com' && password === 'haupham0312') {
    return res.status(200).json({
      message: 'Login successfully!!!'
    })
  }
  return res.json({ message: 'Login failure!!!' })
}

export const registerController: RequestHandler = async (
  req: Request<ParamsDictionary, any, RegisterRequestBody>,
  res
) => {
  try {
    const result = await usersService.registerService(req.body)
    return res.status(200).json({ message: 'Register successfully!!!', result })
  } catch {
    return res.status(500).json({ message: 'Register failure!!!' })
  }
}
