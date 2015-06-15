var env = { staticurl:'saymay.be' };

var express = require('express');

env['app'] = express();

env['plugins'] = ['auth', 'comments'];


env.dir = __dirname;

env.basetemps = [ {selector:'#boilerplate-container', filename:'ntnews.htm'} ];

exports.setRoutes = function() {
	require('./ntn_showem.js')(env);
};

exports.env = env;

