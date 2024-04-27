import { TweetRequestBody } from '~/models/requests/Tweet.request'
import { databaseService } from './config.service'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'

class TweetsService {
  async checkAndCreateHashTag(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        return databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          { $setOnInsert: new Hashtag({ name: hashtag }) },
          {
            upsert: true
          }
        )
      })
    )
    return hashtagDocuments.map((hashtag) => (hashtag as WithId<Hashtag>)._id)
  }
  async createTweets(body: TweetRequestBody, user_id: string) {
    const hashtag = await this.checkAndCreateHashTag(body.hashtags)
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags: hashtag,
        mentions: body.mentions,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id),
        medias: body.medias
      })
    )
    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })
    return tweet
  }

  async inCreateView(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const tweet = await databaseService.tweets.findOneAndUpdate(
      {
        _id: new ObjectId(tweet_id)
      },
      {
        $inc: inc,
        $currentDate: { updated_at: true }
      },
      {
        returnDocument: 'after',
        projection: {
          guest_views: 1,
          user_views: 1
        }
      }
    )
    return tweet as WithId<{ guest_views: number; user_views: number }>
  }
}

const tweetsService = new TweetsService()
export default tweetsService
