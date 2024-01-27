import { Router } from 'express'
import { createBookmarkController } from '~/controllers/bookmarkControllers'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarkRouter = Router()

bookmarkRouter.post('/', accessTokenValidator, verifyUserValidator, wrapRequestHandler(createBookmarkController))

export default bookmarkRouter
