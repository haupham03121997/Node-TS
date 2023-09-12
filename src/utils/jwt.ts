import jwt, { SignOptions } from 'jsonwebtoken'
import { config } from 'dotenv'
config()

export const signToken = ({
  payload,
  privateKey = process.env.JWT_SECRET as string,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: any
  privateKey?: string
  options?: SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) {
        throw reject(err)
      } else {
        resolve(token as string)
      }
    })
  })
}

export const verifyToken = ({
  token,
  secretOrPublicKey = process.env.JWT_SECRET as string
}: {
  token: string
  secretOrPublicKey?: string
}) => {
  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (err, decode) => {
      if (err) throw reject(err)
      resolve(decode as jwt.JwtPayload)
    })
  })
}
