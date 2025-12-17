import createError from 'http-errors'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import helmet from 'helmet'

import indexRouter from './routes/index.js'
import collectionsRouter from './routes/collections.js'
import collectionRouter from './routes/collection.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Keep lenient for inline scripts
  crossOriginEmbedderPolicy: false
}))
app.disable('x-powered-by')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use('/', indexRouter)
app.use('/collections', collectionsRouter)
app.use('/collection', collectionRouter)
app.use(express.static(path.join(__dirname, 'public')))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, _next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.redirect('/error.html')
})

export default app
