var	fs = require('fs');
var	os = require('os');
var net = require('net');
var http = require('http');
var express = require('express');
var mongoose = require('mongoose');
var mongoStore = require('connect-mongo')(express);

var temptools = require('./temptools');
var schemetools = require('./schemetools');

var webserver_app, proxy_server;
var proxies = {};


/*
 * configureAppEnv - setup some basic app functionality,
 */
function configureAppEnv(e) {

	var clandestine = e.clandestine + '_' + os.hostname() + '_' + e.appname;
	if (e.targetapp) clandestine = clandestine + '_' + e.targetapp;

	temptools.configureTemplates(e);

	e.app.use(express.staticCache());
	e.app.use(express.bodyParser());
	e.app.use(express.cookieParser(clandestine));

/*
	if (e.targetapp) e.app.use(express.cookieSession({
								key:e.appname + '-admin.sid'
								, secret: clandestine
								}));
	else e.app.use(express.session({
								key:e.appname + '.sid'
								, store: new mongoStore({db:'sessions', clear_interval:3600})
								}));
*/ 
	e.app.use(express.cookieSession({
								key: e.appname + (e.targetapp ? '-admin.sid' : '.sid')
								}));

	e.app.use('/browser/', express.static(e.dir + '/browser/'));

	e.app.use(express.logger({immediate:true, format: '[:date] ' + e.appname + ' :remote-addr ":method :url" :status ":referrer"'}));

	e['hook'] = [];

	return e.app;
}




function setupFavico(ea, done) {
	var d = __dirname+'/../apps/' + ea.env.appname + '/browser/favicon.ico';
	fs.stat(d, function(err, stat) {
		if (err) ea.app.use(express.favicon());
		else ea.app.use(express.favicon(d));
		done(ea);
	});
}


/*
** configure templates; setup serving of browser files (scripts, css, favicon)
** and ensuring that ajax pages get a basic skeleton.
** ---------------
** it's important to know where all the routing is,
** cos the first attempt to add a route cements the middleware priority
** much easier if it's all in one spot, so:
*/
function setupRoutes(ea) {

	setupFavico(ea, function(a) { // don't do anything until we've hijacked the favico

/*
 * first, these serve up the compiled js and css
 */
		a.app.get("/" + a.env.appname + ".css", function(req, res){
			res.contentType('text/css');
			res.send(a.env.cssstring);
		});
		a.app.get("/" + a.env.appname + ".js", function(req, res){
			res.contentType('text/javascript');
			res.send(a.env.scriptplatestring);
		});

		// then comes routing for any plugins,
		for (var i in a.env.plugins) {
			a.env.hook[a.env.plugins[i]] =  // some common modules return a hook, or array of hooks 
				require('../common/' + a.env.plugins[i] + '/' + a.env.plugins[i] + '.js')(a.env);  // common routing (server script)
		}

		a.setRoutes();		// now we add all the app-specific routes

/*
 * and finally, this makes sure that ajax pages serve up the skeleton	
 * in the case of where there is nothing else to server at the route
 * i.e. it's all built on the client by a script
 */
		a.app.get(/\/$/, function(req, res){
			a.env.respond(req, res, a.env.basetemps);
		});
	});
}



/*
 * setupServer - prepare to listen for http connections
 * -----------
 *  all trafic comes through the closure in here.
 *  if it's not for one of our apps, we check the proxies.
 *  if it's
 *  port : port to listen for HTTP trafic
 *  applist : list of apps served by this webserver
 *  ip : optional IP to listen on - in case our box has more than one
 *  passon : an object containing properties that should be passed on to each app env
 */
function setupServer(port, applist, ip, passon) {
var webserverserver, webserver_app = express();
var eachapp, e;
var admdb = mongoose.createConnection(schemetools.URIofDB(passon.mongopts, 'justsayadmin'));
var dbs = [admdb];

	for (var l=applist.length-1; l>=0; l--) {
		var n = applist[l].appname;
		if (! _.isArray(applist[l].dname))
			applist[l].dname = [applist[l].dname];
	
		eachapp = require('../apps/' + n + '/' + n + '_app.js');
		e=eachapp.env;

		if (e) { // not static ...
			e.appname = n;
			e.url = applist[l].dname[0];

			for (var key in passon) {
				if (! e[key]) {
					e[key] = passon[key];
				}
			}
			eachapp.app = configureAppEnv(e);
			setupRoutes(eachapp);

			var this_admin = require('./admin/admin')(e, admdb);
			this_admin.app = configureAppEnv(this_admin.env);
			setupRoutes(this_admin);
			webserver_app.use(express.vhost("admin." + e.url, this_admin.app));

			schemetools.configureDBschema(admdb, e);
			e.db = mongoose.createConnection(schemetools.URIofDB(e.mongopts, n));
            dbs.push(e.db);
		}

		for (i in applist[l].dname) {
			webserver_app.use(express.vhost(applist[l].dname[i], eachapp.app));
			webserver_app.use(express.vhost("www." + applist[l].dname[i], eachapp.app));
		}
  	}

  webserver_app.use(express.logger());
  webserver_app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

	/*
	// see above, we .use vhosts for all matching apps.
	// if we match in this catch-all, its cos the host is not one we're serving.
	// either it's one we're proxying for, or it's a mystery host ...
	*/
	webserver_app.all('*', function(req, res){
        var p;
		if (proxies) {
			if ((p = proxies[req.header('Host')])) {
				var proxy = http.createClient(80, p);
				proxy.addListener('error', function() {
					console.log('Proxy connection failed');
					proxies[req.header('Host')] = undefined;
				});

				var proxy_request = proxy.request(req.method, req.url, req.headers);
				proxy_request.addListener('response', function (proxy_response) {
					proxy_response.addListener('data', function(chunk) {
						res.write(chunk, 'binary');
					});
					proxy_response.addListener('end', function() {
	 console.log('passing ' + req.url + ' response from ' + req.header('Host') + ' via proxy.');
						res.end();
					});
					proxy_response.addListener('error', function(e) {
	console.log('proxy_response error');
	console.log(e);
	console.log(proxy_response);
						res.end();
					});
					res.writeHead(proxy_response.statusCode, proxy_response.headers);
				});
				req.addListener('data', function(chunk) {
					proxy_request.write(chunk, 'binary');
				});
				req.addListener('end', function() {
	 console.log('PASSING ' + req.url + ' request for ' + req.header('Host') + ' via proxy.');
					proxy_request.end();
				});
				req.addListener('error', function(e) {
	console.log('req error');
	console.log(e);
	console.log(req);
					proxy_request.end();
				});

				return;
			}
		}

/*
 * note: see that return above? that's when we found a proxy to send it to.
 *       if we got down this far, its cos we have an un-handled request.
 *       not worth dying over, but probably worth logging ...
 *
 *       Psst: this is ugly, just for debugging.
 *             so serve prettier errors deeper down ...
 */
	if (req.headers.connection != 'keep-alive') {
console.log('also seen: ' + JSON.stringify(req.headers));
	}

	});

	console.log('listen to ' + (ip?ip:'localhost') + ' on ' + port);
	webserverserver = webserver_app.listen(port, ip);
	webserverserver.on('listening', function(){
		console.log('stepping down to noder');
		process.setuid('noder');
	});
    
    process.on("SIGINT", function(){
        console.log('closing webservers ...');

        if (proxy_server) {
            proxy_server.close();
			proxy_server = null;
        }

        for (var i=0; i<dbs.length; i++) {
            dbs[i].close();
        }

		if (webserverserver) {
			webserverserver.close();
			webserverserver = null;
		}

		console.log(' ... webservers closed.');
    });
    
    webserverserver.on('close', function() {
        console.log('webserver closing')
    });
    proxy_server.on('close', function() {
        console.log('proxyserver closing')
    });
}


function getProxy(name, port, clandestine, proxies) {
	// connect to name:port, to let the proxy server know where we are
	var c = net.createConnection(port, name);
	c.on('connect', function(s){
		console.log('connected to proxy server at ' + name + ':' + port);
		for (var i=proxies.length-1; i>=0; i--) {
		console.log('requesting proxy of ' + proxies[i]);
			c.write(proxies[i] + ' ');
		}
		c.write(clandestine);
	});
	c.on('end', function(e){
		console.log('config connection to proxy server ended.');
		c.end();
	});
	c.on('error', function(e){
		console.log('config connection to proxy server failed.');
		throw e;
	});

    proxy_server = null;
}

function setProxy(port, ip, clandestine) {
	var prollyproxy = {};
	// listen to port.
	// when someone connects, match their IP to the nominated list of hosts to serve for them
	// so that anything that comes to a vhost can be sent back to them as required
   	proxy_server = net.createServer(function(s){
		console.log('creating proxy server');
		var remote_ip = s.remoteAddress;
		s.on('data', function(d){
			var i,l, aStr=String(d).split(' ');

			for (i=0, l=aStr.length; i<l; i++)
				if (aStr[i] == clandestine) {
					for (d in prollyproxy) {
						proxies[d] = prollyproxy[d];
						console.log('authorised redirecting : ' + d + ' to ' + proxies[d]);
					}
					s.end();
				} else if (aStr[i].length) {
					console.log('redirection requested for : ' + aStr[i] + ' to ' + remote_ip);
					prollyproxy[aStr[i]] = remote_ip;
				}
		});
		s.on('error', function(e){
			console.log('proxy read error!');
		});
	}).listen(port, ip);
}


exports.setupServer = setupServer;
exports.setProxy = setProxy;
exports.getProxy = getProxy;

exports.server = webserver_app;

