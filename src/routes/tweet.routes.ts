import { Router } from 'express'
import { createTweetController, getTweetController } from '~/controllers/tweet.controllers'
import { tweetIdValidator } from '~/middlewares/tweets.middleware'
import { accessTokenValidator, isUserLoggedInValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const tweetRouter = Router()

tweetRouter.post(
  '/',
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifyUserValidator),
  wrapRequestHandler(createTweetController)
)

tweetRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifyUserValidator),
  wrapRequestHandler(getTweetController)
)

export { tweetRouter }
