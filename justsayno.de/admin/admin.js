var	express = require('express');

module.exports = function(e, admdb) {

	var xprts = {};

	var env = { app : express()
				,  dir : __dirname
				,  appname : 'admin'
				,  targetapp : e.appname
				,  targetenv : e
				,  staticurl : 'saymay.be'
		};


	env.basetemps = [ {selector:'#boilerplate-container', filename:'admin.htm'} ];


	xprts.setRoutes = function() {
		require('./admin_routes.js')(env, e, admdb);
	};

	xprts.env = env;

	return xprts;
};

