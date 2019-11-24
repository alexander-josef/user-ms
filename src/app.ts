import * as bodyParser from 'body-parser'
import * as dotenv from 'dotenv'
import * as express from 'express'
import * as expressWinston from 'express-winston'
import * as mongoose from 'mongoose'
import * as winston from 'winston'
import { APIRoute } from './routes/api'
import { UserRoute } from './routes/user'
import * as errorHandler from './utility/errorHandler'
import { OrderAPILogger } from './utility/logger'

class App {
  public app: express.Application
  public apiRoutes: APIRoute = new APIRoute()
  public userRoutes: UserRoute = new UserRoute()
  public mongoUrl: string
  public mongoUser: string
  public mongoPass: string
  // public mongoUrl: string = 'mongodb://localhost/order-api' -> use env variables instead


  constructor() {
    const path = `${__dirname}/../.env.${process.env.NODE_ENV}`

    dotenv.config({ path: path }) // -> this creates env variables according to the . file of the active environment the process is running in?
/*     this.mongoUrl = `mongodb://${process.env.MONGODB_URL_PORT}/${
      process.env.MONGODB_DATABASE
    }`
*/

    this.mongoUrl = `${process.env.MONGODB_URL_PORT}/${process.env.MONGODB_DATABASE}` // connection string for dev/test
    this.mongoUser = `${process.env.MONGODB_USER}`
    this.mongoPass = `${process.env.MONGODB_PASS}`

    this.app = express()
    this.app.use(bodyParser.json())
    this.apiRoutes.routes(this.app)
    this.userRoutes.routes(this.app)
    this.mongoSetup()
    this.app.use(
      expressWinston.errorLogger({
        transports: [new winston.transports.Console()],
      })
    )
    this.app.use(errorHandler.logging)
    this.app.use(errorHandler.clientErrorHandler)
    this.app.use(errorHandler.errorHandler)
  }

  private mongoSetup(): void {
    let options

    if (process.env.NODE_ENV !== 'prod') {
      options = {
        useNewUrlParser: true,
      }
    } else { // different handling for prod (hosted atlas mongoDB with username / password)
      this.mongoUrl = `${process.env.MONGODB_URL_PORT}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority` // different URI for Atlas connection in prod
      options = {
        user: this.mongoUser,
        pass: this.mongoPass,
        useNewUrlParser: true,
      }
    }
    OrderAPILogger.logger.info(`using connection string: ${this.mongoUrl} - user: ${this.mongoUser} - pass: ${this.mongoPass}`)

    mongoose.connect(
      this.mongoUrl,
      options
    )
  }
}

export default new App().app
