import { RequestHandler } from 'express'

export const loginController: RequestHandler = (req, res) => {
  const { email, password } = req.body
  if (email === 'haupham0312@gmail.com' && password === 'haupham0312') {
    return res.status(200).json({
      message: 'Login successfully!!!'
    })
  }
  return res.json({ message: 'Login failure!!!' })
}
