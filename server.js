var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//Requiero mi módulo de mongoose para que se conecte
require("./lib/connectMongoose");

//Requiero mis modelos para que mongoose los conozca
require("./models/linea_models");
require("./models/repositorio_models");

var analisisLineasNaranjas = require('./routes/analisisLineasNaranjas');
var clasificacionLineasConflictivas = require('./routes/clasificacionLineasConflictivas');
var datosIniciales = require('./routes/datosIniciales');

var app = express();



// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public/assets/images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1/analisisLineasNaranjas', analisisLineasNaranjas);
app.use('/api/v1/clasificacionLineasConflictivas',  clasificacionLineasConflictivas);
app.use('/api/v1/datosIniciales',  datosIniciales);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
