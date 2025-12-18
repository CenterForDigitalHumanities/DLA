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
import apiRouter from './routes/api.js'

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
app.use('/api', apiRouter)
app.use(express.static(path.join(__dirname, 'public')))

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})

// error handler
app.use((err, req, res, _next) => {
  const status = err.status || 500
  const isDev = req.app.get('env') === 'development'
  
  // Log errors
  console.error(`[${new Date().toISOString()}] ${status} ${req.method} ${req.originalUrl}`, isDev ? err : '')
  
  // Set response
  res.status(status)
  res.set('Content-Type', 'text/html')
  res.send(getErrorHTML(status, isDev ? err.message : 'An error occurred'))
})

// Helper function to generate error HTML
function getErrorHTML(status, message) {
  const statusText = {
    404: 'Page Not Found',
    500: 'Internal Server Error',
    403: 'Forbidden',
    400: 'Bad Request'
  }[status] || 'Error'
  
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${status} - ${statusText}</title>
    <style>
      body { font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; color: #333; }
      h1 { color: #d32f2f; }
      p { line-height: 1.6; }
      .details { background: #f5f5f5; padding: 10px; border-left: 4px solid #d32f2f; margin: 20px 0; }
      a { color: #1976d2; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <h1>${status} ${statusText}</h1>
    <p>${message}</p>
    ${message && message !== 'An error occurred' ? `<div class="details"><strong>Details:</strong> ${message}</div>` : ''}
    <p><a href="/">← Back to Home</a></p>
  </body>
</html>
  `.trim()
}

export default app
