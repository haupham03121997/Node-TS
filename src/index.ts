import express, { Express } from 'express'
import dotenv from 'dotenv'
import { usersRouter } from './routes/users.routes'
import { databaseService } from './services/config.service'
import { defaultErrorHandler } from './middlewares/err.middleweres'
import mediaRouter from './routes/media.routes'
import { initFolder } from './utils/file'

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
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})
