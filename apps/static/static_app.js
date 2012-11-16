var express = require('express');
var app = express();

app.use(express.logger({immediate:true, format: '[:date] STATIC :remote-addr ":method :url" :status ":referrer"'}));
app.configure(function(){
	app.use(express.staticCache());
	app.use('/', express.static(__dirname + '/public'));
});

exports.app = app;
