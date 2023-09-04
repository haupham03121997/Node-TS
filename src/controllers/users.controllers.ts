import { RequestHandler } from 'express'
import User from '~/models/schemas/User.schema'
import { databaseService } from '~/services/config.service'
import { usersService } from '~/services/user.service'

export const loginController: RequestHandler = (req, res) => {
  const { email, password } = req.body
  if (email === 'haupham0312@gmail.com' && password === 'haupham0312') {
    return res.status(200).json({
      message: 'Login successfully!!!'
    })
  }
  return res.json({ message: 'Login failure!!!' })
}

export const registerController: RequestHandler = async (req, res) => {
  const { email, password } = req.body
  try {
    const result = await usersService.registerService({ email, password })
    return res.status(200).json({ message: 'Register successfully!!!', result })
  } catch {
    return res.status(500).json({ message: 'Register failure!!!' })
  }
}
