var express = require('express');
var logger = require('morgan');
var sstatic = require('serve-static');
var app = express();

app.use(logger( '[:date] STATIC :remote-addr ":method :url" :status ":referrer"', {immediate:true}));

app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});

app.use('/', sstatic(__dirname + '/public'));

exports.app = app;
