import { Router } from 'express'
import { createTweetController } from '~/controllers/tweet.controllers'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const tweetRouter = Router()

tweetRouter.post('/', accessTokenValidator, verifyUserValidator, wrapRequestHandler(createTweetController))

export { tweetRouter }
