import { databaseService } from './config.service'
import Bookmark from '~/models/schemas/Bookmark.schema'
import { ObjectId } from 'mongodb'

class BookmarksService {
  async bookmarkTweet(user_id: string, tweet_id: string) {
    return databaseService.bookmarks.insertOne(
      new Bookmark({
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      })
    )
  }
}

const bookmarksService = new BookmarksService()
export default bookmarksService
