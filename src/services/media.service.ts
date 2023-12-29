import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import fs from 'fs'

import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import { isProduction } from '~/configs'
import { config } from 'dotenv'
import { MediaType } from '~/constants/enums'
import { UPLOAD_DIR_IMAGE, UPLOAD_DIR_VIDEO } from '~/constants/dir'
config()
class MediaService {
  async handleUploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newPath = path.resolve(UPLOAD_DIR_IMAGE, `${newName}.jpg`)
        const info = await sharp(file.filepath).jpeg().toFile(newPath)
        if (info) {
          fs.unlinkSync(file.filepath)
        }
        return {
          url: isProduction ? process.env.HOST : 'http:localhost:4000' + `/medias/static/${newName}.jpg`,
          type: MediaType.Image
        }
      })
    )
    return result
  }
  async handleUploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const { newFilename, filepath } = files[0]
    // const newName = getNameFromFullName(newFilename)
    // const newPath = path.resolve(UPLOAD_DIR_VIDEO, `${newName}.mp4`)
    // const info = await sharp(filepath).v().toFile(newPath)
    // if (info) {
    //   fs.unlinkSync(filepath)
    // }
    return {
      url: isProduction ? process.env.HOST : 'http:localhost:4000' + `/medias/static/videos/${newFilename}`,
      type: MediaType.Video
    }
    // const result = await Promise.all(
    //   files.map(async (file) => {
    //     const newName = getNameFromFullName(file.newFilename)
    //     const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`)
    //     const info = await sharp(file.filepath).jpeg().toFile(newPath)
    //     if (info) {
    //       fs.unlinkSync(file.filepath)
    //     }
    //     return {
    //       url: isProduction ? process.env.HOST : 'http:localhost:4000' + `/medias/static/${newName}.jpg`,
    //       type: MediaType.Video
    //     }
    //   })
    // )
    // return result
  }
}

const mediaService = new MediaService()
export default mediaService
