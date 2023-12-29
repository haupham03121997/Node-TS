import { Router } from 'express'
import { uploadImageController, uploadVideoController } from '~/controllers/media.controllers'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
const mediaRouter = Router()

mediaRouter.post('/upload-image', uploadImageController)
mediaRouter.post('/upload-video', uploadVideoController)

export default mediaRouter
