var	os = require('os')
 ,	express = require('express')
 ,	MongStore = require('connect-mongo')(express)
;

module.exports = function(e, admdb) {

	var xprts = {};

	var env = { app : express.createServer()
				,  dir : __dirname
				,  appname : 'admin'
				,  targetapp : e.appname
				,  targetenv : e
				,  staticurl : e.staticurl
		};


	env.basetemps = [ {selector:'#boilerplate-container', filename:'admin.htm'} ];


	xprts.setRoutes = function() {
		require('./admin_routes.js')(env, e, admdb);
	};

	xprts.env = env;

	return xprts;
};

