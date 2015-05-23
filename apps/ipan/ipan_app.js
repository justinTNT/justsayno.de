
var express = require('express');

var env = { staticurl:'saymay.be'
			, app: express()
			, plugins: ['auth', 'comments', 'menu']
			, dir: __dirname
			, basetemps: [ {selector:'#boilerplate-container', filename:'ipan.htm'} ]
		};

exports.setRoutes = function() {
	require('./ipan_showem.js')(env);
};

exports.env = env;

