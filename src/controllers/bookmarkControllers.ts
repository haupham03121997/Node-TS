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
  return res.status(200).send({ message: 'Lưu thành công', result })
}

export const unBookmarkController: RequestHandler = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const result = await bookmarksService.unBookmarkTweet(user_id || '', req.params.tweet_id)
  return res
    .status(result ? 200 : 404)
    .send({ message: result ? 'Huỷ lưu thành công' : 'Không tìm thấy dữ liệu', result })
}
