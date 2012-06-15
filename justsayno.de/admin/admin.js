var	os = require('os')
 ,	express = require('express')
 ,	MongStore = require('connect-mongo')(express)
;

module.exports = function(e, admdb) {

	var xprts = {};

	function logger(req, res, next) {
		console.log('    >   ' + req.url);
		if (req.session) {
			console.log('SESSION ' + req.session.id);
			console.log(req.session.user);
		} else {
			console.log('NO SESSION');
		}
		next();
	}

	var env = { app : express.createServer(
//					express.bodyParser()
//					, express.cookieParser()
//					, express.session({
//						store: new MongStore({db: e.appname})
//						, secret: os.hostname() + '_' + e.appname
//					}),
					logger
				)
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

