import { Request } from 'express'
import { File, Part } from 'formidable'
import fs from 'fs'
import path from 'path'

export const initFolder = () => {
  const temp = path.resolve('uploads/temp')
  const uploadFolderPath = temp
  if (!fs.existsSync(uploadFolderPath)) {
    fs.mkdirSync(uploadFolderPath)
  }
}
export const handleUploadSingleImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: path.resolve('uploads/temp'),
    maxFiles: 2,
    keepExtensions: true,
    maxFileSize: 300 * 1024 * 1024,
    filter: ({ name, originalFilename, mimetype }: Part) => {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/')) && originalFilename
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }

      return !!valid
    }
  })

  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      console.log('fields', fields)
      console.log('files', files)
      if (err) {
        reject(err)
      }
      if (!Boolean(files.image)) {
        reject(new Error('File type is not valid'))
      }
      resolve((files?.image as File[])[0])
    })
  })
}

export const getNameFromFullName = (fillName: string) => {
  const namearr = fillName.split('.')
  namearr.pop()
  return namearr.join('')
}
