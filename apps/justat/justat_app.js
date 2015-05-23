var env = { staticurl:'saymay.be' };

var express = require('express');

env['app'] = express();

env['plugins'] = ['auth', 'comments']


env.dir = __dirname;

env.basetemps = [ {selector:'#boilerplate-container', filename:'justat.htm'} ];

exports.setRoutes = function() {
	require('./ja_showem.js')(env);
};

exports.env = env;

