import { Router } from 'express'
import {
  changePasswordController,
  emailVerifyController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  oauthController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  unFollowController,
  updateMeProfileController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import { filterBodyMiddleware } from '~/middlewares/common.middleware'

import {
  accessTokenValidator,
  changePasswordValidator,
  emailTokenValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifyForgotPasswordTokenValidator,
  verifyUserValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeRequestBody } from '~/models/requests/User.request'

const usersRouter = Router()

/**
 * Description: Login when user click button
 * Path: /login
 * Method: POST
 * Body: { email: string, password: string }
 * Header: {Authorization : Not Required}
 */
usersRouter.post('/login', loginValidator, loginController)

/**
 * Description: Login with OAuth
 * Path: /oauth/goole
 * Method: POST
 * Body: { email: string, password: string }
 * Header: {Authorization : Not Required}
 */
usersRouter.get('/oauth/google', oauthController)

/**
 * Description: Register user, insert Database
 * Path: /login
 * Method: POST
 * Body: {name :string email: string, password: string,confirm_password :string , date_of_birth: Date (IOS Date) }
 * Header: {Authorization : Not Required}
 */
usersRouter.post('/register', registerValidator, registerController)

/**
 * Description: Logout user , remove refresh_token
 * Path: /login
 * Method: POST
 * Body: { refresh_token :string }
 * Header: {Authorization : access_token}
 */
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

/**
 * Description: Reset password when user changed password
 * Path: /reset-password
 * Method: Post
 * Body: { password :string, confirm_password: string , forgot_password_token :string}
 * Header: {Authorization : Not Required}
 */
usersRouter.post('/reset-password', resetPasswordValidator, resetPasswordController)

/**
 * Description: Get my profile
 * Path: /me
 * Method: GET
 * Body: { }
 * Header: {Authorization : access_token}
 */
usersRouter.get('/me', accessTokenValidator, getMeController)

/**
 * Description: Update my profile
 * Path: /me
 * Method: PAT
 * Body: { userSchema}
 * Header: { Authorization : access_token }
 */
usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifyUserValidator,
  updateMeValidator,
  filterBodyMiddleware<UpdateMeRequestBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  updateMeProfileController
)

/**
 * Description: Get  profile
 * Path: /user-profile
 * Method: GET
 * Body: { }
 * Header: {Authorization : Not Required}
 */
usersRouter.get('/:username', getProfileController)

/**
 * Description: Follow someone
 * Path: /follow
 * Method: POST
 * Body: { user_id: string }
 * Header: {Authorization : access_token}
 */
usersRouter.post('/follow', accessTokenValidator, verifyUserValidator, followValidator, followController)

/**
 * Description: Unfollow someone
 * Path: /follow
 * Method: DELETE
 * Body: {  }
 * Header: {Authorization : access_token}
 */
usersRouter.delete('/follow/:user_id', accessTokenValidator, verifyUserValidator, unfollowValidator, unFollowController)

/**
 * Description: Change password
 * Path: /change-password
 * Method: UPDATE
 * Body: { old_password: string, password: string  , new_password: string }
 * Header: {Authorization : access_token}
 */
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifyUserValidator,
  changePasswordValidator,
  changePasswordController
)

export { usersRouter }
