import { Router } from 'express'
import {
  emailVerifyController,
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

usersRouter.post('/login', loginValidator, loginController)
usersRouter.post('/register', registerValidator, registerController)
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, logoutController)

/**
 * Description: Verify email when user client click on the link in email
 * Path: verify-email
 * Method: POST
 * Body: { email_verify_token: string }
 */
usersRouter.post('/verify-email', accessTokenValidator, emailTokenValidator, emailVerifyController)

/**
 * Description: Resend verify email when user client click on the link in email
 * Path: resend-verify-token
 * Method: POST
 * Body: { }
 * Header: {Authorization : access_token}
 */
usersRouter.post('/resend-verify-email', accessTokenValidator, resendVerifyEmailController)

/**
 * Description: Submit email to reset password, send email to user
 * Path: forgot-password
 * Method: Post
 * Body: { email :string}
 * Header: {Authorization : Not Required}
 */

usersRouter.post('/forgot-password', forgotPasswordValidator, forgotPasswordController)

/**
 * Description: Verify link in email to reset password
 * Path: /verify-forgot-password
 * Method: Post
 * Body: { token :string}
 * Header: {Authorization : Not Required}
 */

usersRouter.post('/verify-forgot-password', verifyForgotPasswordTokenValidator, verifyForgotPasswordTokenController)

export { usersRouter }
