var env = { staticurl:'saymay.loc' };

var express = require('express');

env['app'] = express();

env['plugins'] = ['auth'];


env.dir = __dirname;

env.basetemps = [ {selector:'#boilerplate-container', filename:'darwin.htm'} ];

exports.setRoutes = function() {
	require('./darw_showem.js')(env);
};

exports.env = env;

