import { Router } from 'express'
import { createBookmarkController, unBookmarkController } from '~/controllers/bookmarkControllers'
import { tweetIdValidator } from '~/middlewares/tweets.middleware'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarkRouter = Router()

bookmarkRouter.post(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapRequestHandler(createBookmarkController)
)
bookmarkRouter.delete(
  '/:tweet_id',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unBookmarkController)
)
export default bookmarkRouter
