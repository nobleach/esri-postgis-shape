
/**
 * Module dependencies.
 */

var express = require('express');
var pg = require('pg');
var routes = require('./routes');

var http = require('http');
var path = require('path');

var conString = "postgres://utilisync:utilisync@localhost/utilisync";
var client = new pg.Client(conString);
client.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
});

var app = express();

//cheap quick middleware:
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
};

// all environments
app.set('port', process.env.PORT || 3000);
app.use(allowCrossDomain);
app.use(express.bodyParser());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var sketch = require('./routes/sketch');
sketch.inject(client);

var photo = require('./routes/photo');
sketch.inject(client);

app.post('/sketch/save', sketch.save);
app.get('/sketch/:id', sketch.find);
app.get('/sketch/download/:id', sketch.download);
app.post('/upload', photo.upload);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
