var express = require('express');
var app = express.createServer();

app.use(express.logger());
app.configure(function(){
	app.use(express.staticCache());
	app.use('/', express.static(__dirname + '/public'));
});

app.get('/hello', function(req, res){
	res.send("well hello there.<br>I'm serving static content. whatever I'm called.");
});

exports.app = app;
