import { RequestHandler, Request, Response, NextFunction } from 'express'
import formidable from 'formidable'
import fs from 'fs'
import mime from 'mime'
import path from 'path'
import { UPLOAD_DIR_IMAGE, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'
import mediaService from '~/services/media.service'

import { wrapRequestHandler } from '~/utils/handlers'

export const uploadImageController: RequestHandler = wrapRequestHandler(async (req: Request, res) => {
  const result = await mediaService.handleUploadImage(req)
  console.log(result)
  res.json({ result })
})

export const uploadVideoController: RequestHandler = wrapRequestHandler(async (req: Request, res) => {
  const result = await mediaService.handleUploadVideo(req)
  console.log(result)
  res.json({ result })
})

export const saveImageController: RequestHandler = wrapRequestHandler(async (req: Request, res) => {
  const { name } = req.params
  console.log(path.resolve(UPLOAD_DIR_IMAGE, name))
  res.sendFile(path.resolve(UPLOAD_DIR_IMAGE, name), (err) => {
    if (err) {
      res.status(400).send('Image not found')
    }
  })
})

export const saveVideoController: RequestHandler = wrapRequestHandler(async (req: Request, res) => {
  const { range } = req.headers
  if (!range) {
    return res.status(500).send('Requires range header')
  }
  const { name } = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_TEMP_DIR, name)
  const videoSize = fs.statSync(videoPath).size
  // 1MB = 10^6 bytes (tính theo hệ 10)
  // 1MB = 2^20 (1024 * 1024) (tính theo hệ thập phân)
  const chunkSize = 10 ** 6 // 1MB

  const start = Number(range.replace(/\D/g, ''))
  const end = Math.min(start + chunkSize, videoSize)

  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize - 1}`,
    'Access-Range': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(206, headers)
  const videStream = fs.createReadStream(videoPath, { start, end })
  videStream.pipe(res)
})
