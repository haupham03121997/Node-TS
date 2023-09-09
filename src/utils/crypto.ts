import { createHash } from 'crypto'

/**
 * Returns a SHA256 hash using SHA-2 for the given `content`.
 *
 * @see https://en.wikipedia.org/wiki/SHA-2
 *
 * @param {String} password
 *
 * @returns {String}
 */
export function sha256(password: string) {
  return createHash('sha256')
    .update(password + process.env.PASSWORD_HASH)
    .digest('hex')
}
