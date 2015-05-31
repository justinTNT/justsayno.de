
var express = require('express');

var env = { staticurl:'saymay.be'
			, app: express()
			, plugins: ['auth', 'comments', 'menu', 'page']
			, dir: __dirname
			, basetemps: [ {selector:'#boilerplate-container', filename:'basewatch.htm'} ]
		};

exports.setRoutes = function() {
	require('./bw_showem.js')(env);
};

exports.env = env;

