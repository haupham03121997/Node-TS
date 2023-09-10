import express from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import { ErrorEntity, ErrorWithStatus } from '~/models/Error'
// can be reused by many routes

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // for (let validation of validations) {
    //   const result = await validation.run(req)
    //   if (result.errors.length) break
    // }

    await validations.run(req)

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    const errorsObject = errors.mapped() // {errorsObject : {key : {key: string}}}
    const errorEntity = new ErrorEntity({ errors: {} })
    for (const key in errorsObject) {
      const { msg } = errorsObject[key]
      if (msg instanceof ErrorWithStatus && msg.status !== 422) {
        return next(msg)
      }
      errorEntity.errors[key] = errorsObject[key]
    }

    next(errorEntity)
  }
}
