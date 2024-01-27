import { RequestHandler, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BookmarkRequestBody } from '~/models/requests/Bookmark.request'
import { TokenPayload } from '~/models/requests/User.request'
import bookmarksService from '~/services/bookmarks.service'

export const createBookmarkController: RequestHandler = async (
  req: Request<ParamsDictionary, any, BookmarkRequestBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await bookmarksService.bookmarkTweet(user_id || '', req.body.tweet_id)
  console.log('createBookmarkController', result)
  return res.status(200).send({ message: 'Tạo thành công', result })
}
