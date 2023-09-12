import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { accessTokenValidator, loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

usersRouter.post('/login', loginValidator, loginController)
usersRouter.post('/register', registerValidator, registerController)
usersRouter.post(
  '/logout',
  accessTokenValidator,
  wrapRequestHandler((req, res) => {
    res.json({ message: 'Logout success' })
  })
)

export { usersRouter }
