
var express = require('express');

var env = { staticurl:'saymay.be'
			, app: express()
			, plugins: ['auth', 'comments']
			, dir: __dirname
			, basetemps: [ {selector:'#boilerplate-container', filename:'page.htm'} ]
		};

exports.setRoutes = function() {
	require('./path_showem.js')(env);
};

exports.env = env;

