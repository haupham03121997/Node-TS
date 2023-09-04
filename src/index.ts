import express, { Express, Request, Response } from 'express'
import dotenv from 'dotenv'
import { usersRouter } from './routes/users.routes'
import { databaseService } from './services/config.service'

dotenv.config()

const app: Express = express()
const port = process.env.PORT

databaseService.connect().catch(console.dir)

app.use(express.json())

app.use('/users', usersRouter)

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})
