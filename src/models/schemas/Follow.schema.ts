import { ObjectId } from 'mongodb'

interface FollowerType {
  user_id: ObjectId
  created_at?: Date
  followed_user_id: ObjectId
}

export class Follower {
  user_id: ObjectId
  created_at?: Date
  followed_user_id: ObjectId
  constructor({ followed_user_id, created_at, user_id }: FollowerType) {
    this.followed_user_id = followed_user_id
    this.created_at = created_at || new Date()
    this.user_id = user_id
  }
}
