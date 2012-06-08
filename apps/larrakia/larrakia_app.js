var env = { staticurl:'la.rrak.in' };

var express = require('express');

env['app'] = express.createServer(
				express.bodyParser()
/*
				, express.cookieParser(),
				express.session({ secret:os.hostname() + '_' + env.staticurl })
*/
				);

env['plugins'] = ['auth', 'menu', 'comments'];

env.app.use(express.logger());
env.app.configure(function(){
});

env.dir = __dirname;

env.basetemps = [ {selector:'#boilerplate-container', filename:'larrakia.htm'} ];

exports.setRoutes = function() {
	require('./lnac_showem.js')(env);
};

exports.env = env;

