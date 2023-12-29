import { Request } from 'express'
import { File, Part } from 'formidable'
import fs from 'fs'
import path from 'path'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].map((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}
export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_IMAGE_TEMP_DIR),
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 3 * 1024 * 1024, // 3MB
    filter: ({ name, originalFilename, mimetype }: Part) => {
      console.log({ name, originalFilename, mimetype })
      const valid = name === 'image' && Boolean(mimetype?.includes('image/')) && originalFilename
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }

      return !!valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err)
      }
      if (!Boolean(files.image)) {
        reject(new Error('File type is not valid'))
      }
      resolve(files?.image as File[])
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_VIDEO_TEMP_DIR),
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: ({ name, originalFilename, mimetype }: Part) => {
      // console.log({ name, originalFilename, mimetype })
      // const valid = name === 'image' && Boolean(mimetype?.includes('image/')) && originalFilename
      // if (!valid) {
      //   form.emit('error' as any, new Error('File type is not valid') as any)
      // }

      // return !!valid
      return true
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err)
      }
      if (!Boolean(files.video)) {
        reject(new Error('File type is not valid'))
      }
      resolve(files?.video as File[])
    })
  })
}

export const getNameFromFullName = (fillName: string) => {
  const namearr = fillName.split('.')
  namearr.pop()
  return namearr.join('')
}
