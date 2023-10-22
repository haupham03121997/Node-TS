import { ObjectId } from 'mongodb'

interface RefreshTokenType {
  id?: ObjectId
  token: string
  created_at?: Date
  user_id: string
}

export class RefreshToken {
  token: string
  created_at?: Date
  user_id: string
  constructor({ token, created_at, user_id }: RefreshTokenType) {
    this.token = token
    this.created_at = created_at || new Date()
    this.user_id = user_id
  }
}
