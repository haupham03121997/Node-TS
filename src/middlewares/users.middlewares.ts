import { RequestHandler } from 'express'
import { checkSchema } from 'express-validator'
import { usersService } from '~/services/user.service'
import { validate } from '~/utils/validation'

export const loginValidator: RequestHandler = (req, res, next) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing email or password'
    })
  }
  next()
}

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: true,
      errorMessage: 'The name is not the blank!'
    },
    email: {
      notEmpty: true,
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
            throw new Error('Email not exits')
          }
          return true
        }
      }
    },
    password: {
      notEmpty: true,
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
      notEmpty: true,
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
    // date_of_birth: {
    //   isISO8601: {
    //     options: {
    //       strict: true,
    //       strictSeparator: true
    //     }
    //   }
    // }
  })
)
