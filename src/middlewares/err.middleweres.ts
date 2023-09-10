import { NextFunction, Request, Response } from 'express'
import { omit } from 'lodash'
import { ErrorWithStatus } from '~/models/Error'

export function defaultErrorHandler(err: any, _: Request, res: Response, next: NextFunction) {
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).send(omit(err, 'status'))
  }
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })
  return res.status(500).json({ message: err.message, errors: omit(err, 'stack') })
}
