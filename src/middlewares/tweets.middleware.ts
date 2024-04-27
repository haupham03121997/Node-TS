import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType } from '~/constants/enums'
import { ErrorWithStatus } from '~/models/Error'
import Tweet from '~/models/schemas/Tweet.schema'
import { databaseService } from '~/services/config.service'
import { numberEnumToArray } from '~/utils/commons'
import { validate } from '~/utils/validation'

export const createTweetsValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: numberEnumToArray(TweetType)
      }
    },
    audience: {
      isIn: {
        options: numberEnumToArray(TweetAudience)
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const types = req.body.type as TweetType
          if ([TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(types) && !ObjectId.isValid(value)) {
            throw new Error('Parent id không hợp lệ')
          }
        }
      }
    },
    content: {
      isString: true
    },
    hashtag: {
      isArray: true
    },
    mentions: {
      isArray: true
    },
    medias: {
      isArray: true
    }
  })
)

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        isMongoId: {
          errorMessage: 'Tweet Id không hợp lệ'
        },
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({ status: 400, message: 'Định dang tweet không hợp lệ' })
            }
            const [tweet] = await databaseService.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
                  }
                },
                {
                  $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    as: 'mentions'
                  }
                },
                {
                  $addFields: {
                    mentions: {
                      $map: {
                        input: '$mentions',
                        as: 'mention',
                        in: {
                          _id: '$$mention._id',
                          name: '$$mention.name',
                          username: '$$mention.username',
                          email: '$$mention.email'
                        }
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                  }
                },
                {
                  $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'likes'
                  }
                },
                {
                  $lookup: {
                    from: 'tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweet_children'
                  }
                },
                {
                  $addFields: {
                    bookmarks: {
                      $size: '$bookmarks'
                    },
                    likes: {
                      $size: '$likes'
                    },
                    retweet_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.Retweet]
                          }
                        }
                      }
                    },
                    comment_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.Comment]
                          }
                        }
                      }
                    },
                    quote_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.QuoteTweet]
                          }
                        }
                      }
                    }
                  }
                },
                {
                  $project: {
                    tweet_children: 0
                  }
                }
              ])
              .toArray()
            if (!tweet) {
              throw new ErrorWithStatus({ status: 404, message: 'Không tìm thấy tweet' })
            }
            ;(req as Request).tweet = tweet
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)

export const audienceValidator = (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  if (tweet.audience === TweetAudience.TwitterCircle) {
    if (!req.decode_authorization) {
      throw new ErrorWithStatus({ status: 401, message: 'Token is required' })
    }
    const { user_id } = req.decode_authorization
  }
  next()
}
