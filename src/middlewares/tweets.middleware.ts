import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType } from '~/constants/enums'
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
