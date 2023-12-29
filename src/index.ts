import express, { Express } from 'express'
import dotenv from 'dotenv'
import { usersRouter } from './routes/users.routes'
import { databaseService } from './services/config.service'
import { defaultErrorHandler } from './middlewares/err.middleweres'
import mediaRouter from './routes/media.routes'
import { initFolder } from './utils/file'
import path from 'path'
import { staticRouter } from './routes/static.routes'
import { UPLOAD_VIDEO_TEMP_DIR } from './constants/dir'
import { tweetRouter } from './routes/tweet.routes'

dotenv.config()

const app: Express = express()
const port = process.env.PORT

initFolder()
databaseService.connect().catch((error) => {
  console.log(error)
})

app.use(express.json())
app.use('/users', usersRouter)
app.use('/medias', mediaRouter)
app.use('/static', staticRouter)
app.use('/static/video', express.static(UPLOAD_VIDEO_TEMP_DIR))
app.use('/medias/static', express.static(path.resolve('uploads')))
app.use('/tweets', tweetRouter)

app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})
