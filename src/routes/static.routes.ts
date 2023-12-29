import { Router } from 'express'
import { saveImageController, saveVideoController } from '~/controllers/media.controllers'

const staticRouter = Router()

staticRouter.get('/image/:name', saveImageController)
staticRouter.get('/videos-stream/:name', saveVideoController)

export { staticRouter }
