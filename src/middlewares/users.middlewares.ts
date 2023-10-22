import { RequestHandler, Request, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ParamSchema, checkSchema } from 'express-validator'
import { JwtPayload } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import { HttpStatus } from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { REGEX_USERNAME } from '~/constants/regex'
import { ErrorWithStatus } from '~/models/Error'
import { LoginRequestBody, TokenPayload } from '~/models/requests/User.request'
import { databaseService } from '~/services/config.service'
import { usersService } from '~/services/user.service'
import { sha256 } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: 'The password is not the blank!'
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 50
    }
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: 'Password must be at 6 charactors long'
  },
  errorMessage: 'The password is not the blank!'
}

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: 'The confirm pass is not the blank!'
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 50
    }
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw Error('Password confirmation does not match password')
      }
      return true
    }
  }
}

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          status: 401,
          message: USERS_MESSAGES.FORGOT_PASSWORD_IS_REQUIRED
        })
      }
      try {
        const decode_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })
        const { user_id } = decode_forgot_password_token
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
        if (user === null) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXITS,
            status: HttpStatus.UNAUTHORIZED
          })
        }
        if (user.forgot_password_token === null) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.INVALID_FORGOT_PASSWORD_TOKEN,
            status: HttpStatus.UNAUTHORIZED
          })
        }
        ;(req as Request).decode_forgot_password_token = decode_forgot_password_token
      } catch {
        throw new ErrorWithStatus({ message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INVALID, status: 401 })
      }
      return true
    }
  }
}

const userSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 50
    },
    errorMessage: USERS_MESSAGES.USERNAME_LENGTH
  },
  custom: {
    options: async (value: string, { req }) => {
      if (!REGEX_USERNAME.test(value)) {
        throw new Error(USERS_MESSAGES.USER_NAME_IS_INVALID)
      }
      const found = await databaseService.users.findOne({ username: value })
      if (found) {
        throw new Error(USERS_MESSAGES.USERNAME_EXISTED)
      }
    }
  }
}

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.IMAGE_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USERS_MESSAGES.IMAGE_LENGTH
  }
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: 'The date of birth invalid format!'
  }
}

const websiteSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 200
    },
    errorMessage: USERS_MESSAGES.WEBSITE_LENGTH
  },
  trim: true
}

const locationSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 200
    },
    errorMessage: USERS_MESSAGES.LOCATION_LENGTH
  }
}

const userIdSchema: ParamSchema = {
  custom: {
    options: async (value, { req }) => {
      if (ObjectId.isValid(value)) {
        if (!String(new ObjectId(value)) === value) {
          throw new ErrorWithStatus({
            status: HttpStatus.NOT_FOUND,
            message: USERS_MESSAGES.INVALID_USER_ID
          })
        }
      }
      const foundUser = await databaseService.users.findOne({ _id: new ObjectId(value) })

      if (!foundUser) {
        throw new ErrorWithStatus({
          status: HttpStatus.NOT_FOUND,
          message: USERS_MESSAGES.USER_NOT_FOUND
        })
      }
    }
  }
}

export const loginValidator = validate(
  checkSchema({
    email: {
      notEmpty: {
        errorMessage: 'The email is not the blank!'
      },
      trim: true,
      matches: {
        options:
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        errorMessage: 'Email is invalid!'
      },
      isLength: {
        options: {
          min: 1
        },
        errorMessage: 'The email is not blank!'
      },
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.users.findOne({ email: value, password: sha256(req.body.password) })
          if (!user) {
            throw new Error('Email or password is incorrect')
          }
          ;(req as Request).user = user
          return true
        }
      }
    },
    password: {
      notEmpty: {
        errorMessage: 'The password is not the blank!'
      },
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: 'Password must be at 6 charactors long'
      },
      errorMessage: 'The password is not the blank!'
    }
  })
)

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: 'The name is not the blank!'
      }
    },
    email: {
      notEmpty: {
        errorMessage: 'The email is not the blank!'
      },
      trim: true,
      matches: {
        options:
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        errorMessage: 'Email is invalid!'
      },
      isLength: {
        options: {
          min: 1
        },
        errorMessage: 'The email is not blank!'
      },
      custom: {
        options: async (value) => {
          const user = await usersService.checkEmailExist(value)

          if (user) {
            throw new Error('Email already exits')
          }
          return true
        }
      }
    },
    password: passwordSchema,
    confirm_password: confirmPasswordSchema,
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        },
        errorMessage: 'The date of birth invalid format!'
      }
    }
  })
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      authorization: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value || '').split(' ')[1]
            console.log('access_token', access_token)
            if (!access_token) {
              throw new ErrorWithStatus({ message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED, status: 401 })
            }
            try {
              const decode_authorization = await verifyToken({
                token: access_token,
                secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              console.log('access_token', decode_authorization)
              ;(req as Request).decode_authorization = decode_authorization
              return true
            } catch (error) {
              throw new Error(error as any)
            }
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                status: 401,
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
              })
            }
            try {
              const [decode_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                databaseService.refreshToken.findOne({ token: value })
              ])

              if (refresh_token === null) {
                throw new ErrorWithStatus({ message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXITS, status: 401 })
              }

              ;(req as Request).decode_refresh_token = decode_refresh_token
            } catch {
              throw new ErrorWithStatus({ message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID, status: 401 })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const emailTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                status: 401,
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
              })
            }
            try {
              const decode_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_VERIFY_EMAIL_TOKEN as string
              })
              ;(req as Request).decode_email_verify_token = decode_email_verify_token
            } catch {
              throw new ErrorWithStatus({ message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INVALID, status: 401 })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        trim: true,
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ email: value })
            console.log({ user })
            if (!user) {
              throw new Error(USERS_MESSAGES.USER_NOT_FOUND)
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const verifyUserValidator = (req: Request, res: any, next: NextFunction) => {
  const { verify } = req.decode_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_VERIFIED,
        status: HttpStatus.FORBIDDEN
      })
    )
  }
  next()
}

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        optional: true,
        isString: {
          errorMessage: 'The name is not the blank!'
        }
      },
      date_of_birth: {
        ...dateOfBirthSchema,
        optional: true
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: 'The bio is not the blank!'
        },
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.BIO_LENGTH
        }
      },
      location: locationSchema,
      website: websiteSchema,
      username: userSchema,
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)

export const followValidator = validate(
  checkSchema(
    {
      followed_user_id: userIdSchema
    },
    ['body']
  )
)

export const unfollowValidator = validate(
  checkSchema(
    {
      user_id: {
        custom: {
          options: async (value, { req }) => {
            if (ObjectId.isValid(value)) {
              if (!String(new ObjectId(value)) === value) {
                throw new ErrorWithStatus({
                  status: HttpStatus.NOT_FOUND,
                  message: USERS_MESSAGES.INVALID_FOLLOWED_USER_ID
                })
              }
            }
            const foundUser = await databaseService.users.findOne({ _id: new ObjectId(value) })

            if (!foundUser) {
              throw new ErrorWithStatus({
                status: HttpStatus.NOT_FOUND,
                message: USERS_MESSAGES.USER_NOT_FOUND
              })
            }
          }
        }
      }
    },
    ['params']
  )
)

export const changePasswordValidator = validate(
  checkSchema({
    old_password: {
      ...passwordSchema,
      custom: {
        options: async (value: string, { req }) => {
          console.log('run run run')
          const { user_id } = (req as Request).decode_authorization as TokenPayload
          const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
          console.log('user', user)
          if (user === null) {
            throw new ErrorWithStatus({
              status: HttpStatus.NOT_FOUND,
              message: USERS_MESSAGES.USER_NOT_FOUND
            })
          }
          const { password } = user
          const isMatch = password === sha256(value)
          if (!isMatch) {
            throw new ErrorWithStatus({
              status: HttpStatus.BAD_REQUEST,
              message: USERS_MESSAGES.OLD_PASSWORD_NOT_MATCH
            })
          }
        }
      }
    },
    password: passwordSchema,
    confirm_password: confirmPasswordSchema
  })
)
