import { RequestHandler, Request, Response, NextFunction } from 'express'
import formidable from 'formidable'
import path from 'path'
import mediaService from '~/services/media.service'

import { wrapRequestHandler } from '~/utils/handlers'

export const uploadSingleImageController: RequestHandler = wrapRequestHandler(async (req: Request, res) => {
  const result = await mediaService.handleUploadSingleImage(req)
  console.log(result)
  res.json({ result })
})
