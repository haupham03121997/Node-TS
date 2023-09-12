import { RequestHandler, Request } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { checkSchema } from 'express-validator'
import { USERS_MESSAGES } from '~/constants/messages'
import { LoginRequestBody } from '~/models/requests/User.request'
import { databaseService } from '~/services/config.service'
import { usersService } from '~/services/user.service'
import { sha256 } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

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
          req.user = user
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
    },
    confirm_password: {
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
    },
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
      Authorization: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            try {
              const access_token = value.replace('Bearer', '')
              if (access_token === '') {
                throw new Error(USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED)
              }
              const decode_authorization = await verifyToken({ token: access_token })
              console.log('decode_authorization', decode_authorization)
              req.decode_authorization = decode_authorization
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
