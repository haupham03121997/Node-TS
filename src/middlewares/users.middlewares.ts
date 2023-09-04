import { RequestHandler } from 'express'

export const loginValidator: RequestHandler = (req, res, next) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing email or password'
    })
  }
  next()
}
