var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv = require('dotenv');
dotenv.config();

var indexRouter = require('./routes/index')
var usersRouter = require('./routes/users')
var managementRouter = require('./routes/management')
var collectionsRouter = require('./routes/collections')
var collectionRouter = require('./routes/collection')
var poemRouter = require('./routes/poem')

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/management', managementRouter)
app.use('/collections', collectionsRouter)
app.use('/collection', collectionRouter)
app.use('/poem', poemRouter)
app.use(express.static(path.join(__dirname, 'public')))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.redirect('/error.html');
});

module.exports = app;
