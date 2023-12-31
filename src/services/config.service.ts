import { MongoClient, Db, Collection, ServerApiVersion } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import { RefreshToken } from '~/models/schemas/RefreshToken.scheme'
import { Follower } from '~/models/schemas/Follow.schema'
config()

const uri = `mongodb+srv://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@twitter.jjxicxg.mongodb.net/?retryWrites=true&w=majority`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    })
    this.db = this.client.db(process.env.DATABASE_NAME)
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log('error', error)
      this.client.close()
      throw error
    }
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DATABASE_USERS_COLLECTION as string)
  }
  get refreshToken(): Collection<RefreshToken> {
    return this.db.collection(process.env.DATABASE_REFRESH_TOKEN_COLLECTION as string)
  }

  get followers(): Collection<Follower> {
    return this.db.collection(process.env.DATABASE_FOLLOWERS_COLLECTION as string)
  }
}

const databaseService = new DatabaseService()

export { databaseService }
