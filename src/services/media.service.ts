import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import fs from 'fs'

import { UPLOAD_DIR } from '~/constants/dir'
import { getNameFromFullName, handleUploadSingleImage } from '~/utils/file'
import { isProduction } from '~/configs'
import { config } from 'dotenv'
config()
class MediaService {
  async handleUploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req)
    const newName = getNameFromFullName(file.newFilename)
    const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`)
    const info = await sharp(file.filepath).jpeg().toFile(newPath)
    if (info) {
      fs.unlinkSync(file.filepath)
    }
    return isProduction ? process.env.HOST : 'http:localhost:4000' + `/uploads/${newName}.jpg`
  }
}

const mediaService = new MediaService()
export default mediaService
