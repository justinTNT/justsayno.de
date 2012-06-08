var	os = require('os');
var net = require('net');
var http = require('http');
var express = require('express');
var mongoose = require('mongoose');

var temptools = require('./temptools');
var schemetools = require('./schemetools');

var webserver_app;
var proxies = {};


/*
 * configureAppEnv - setup some basic app functionality,
 * ---------------
 * configure templates; setup serving of browser files (scripts, css, favicon)
 * and ensuring that ajax pages get a basic skeleton.
 */
function configureAppEnv(e) {

	temptools.configureTemplates(e);

	e.app.configure(function(){						// and this serves up some browser scripts, css, etc
		e.app.use(express.staticCache());
		e.app.use('/browser/', express.static(e.dir + '/browser/'));
		e.app.use(express.bodyParser());
		e.app.use(express.cookieParser());
		e.app.use(express.session({ secret:os.hostname() + '_' + e.staticurl }));
	});

    e.app.get("/" + e.appname + ".css", function(req, res){
		res.contentType('text/css');
    	res.send(e.cssstring);
	});
    e.app.get("/" + e.appname + ".js", function(req, res){
		res.contentType('text/javascript');
    	res.send(e.scriptplatestring);
	});

	e['hook'] = [];

	return e.app;
}


/*
 * this makes sure that ajax pages serve up the skeleton	
 * in the case of where there is nothing else to server at the route
 * i.e. it's all built on the client by a script
 */
function setAppEnvRoot(a, e){
	a.get(/\/$/, function(req, res){
		e.respond(req, res, e.basetemps);
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
var webserver_app = express.createServer();
var eachapp, e;
var admdb = mongoose.createConnection('mongodb://localhost/justsayadmin');

	for (var l=applist.length-1; l>=0; l--) {
		var n = applist[l].appname;
		eachapp = require('../apps/' + n + '/' + n + '_app.js');
		e=eachapp.env;

		if (e) { // not static ...
			e.appname = n;
			e.url = applist[l].dname;
			eachapp.app = configureAppEnv(e);
			schemetools.configureDBschema(e, admdb);

			var this_admin = require('./admin/admin')(e, admdb);
			var this_aapp = configureAppEnv(this_admin.env);
			this_admin.setRoutes();
			setAppEnvRoot(this_aapp, this_admin.env);
			webserver_app.use(express.vhost("admin." + applist[l].dname, this_aapp));

			e.db = mongoose.createConnection('mongodb://localhost/' + n);
			for (i in e.plugins) {
				e.hook[e.plugins[i]] =  // some common modules return a hook, or array of hooks 
					require('../common/' + e.plugins[i] + '/' + e.plugins[i] + '.js')(e);  // common routing (server script)
			}

			eachapp.setRoutes();
			setAppEnvRoot(eachapp.app, e);

			eachapp.app.use(express.static(__dirname+'/../apps/' + n));
			eachapp.app.use(express.favicon(__dirname+'/../apps/' + n));

			for (key in passon) {
				if (! e[key]) {
					e[key] = passon[key];
				}
			}
		}

		applist[l].app = eachapp.app;
		webserver_app.use(express.vhost(applist[l].dname, applist[l].app));
		webserver_app.use(express.vhost("www." + applist[l].dname, applist[l].app));
  	}

  webserver_app.use(express.logger());
  webserver_app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

	/*
	// see above, we .use vhosts for all matching apps.
	// if we match in this catch-all, its cos the host is not one we're serving.
	// either it's one we're proxying for, or it's a mystery host ...
	*/
	webserver_app.all('*', function(req, res){
		if (proxies) {
			if (p = proxies[req.header('Host')]) {
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

	console.log('listening to ' + (ip?ip:'localhost') + ' on ' + port);
	webserver_app.listen(port, ip);
}


function getProxy(name, port, clandestine, proxies) {
	// connect to name:port, to let the proxy server know where we are
	var c = net.createConnection(port, name);
	c.on('connect', function(s){
		console.log('connected to proxy server at ' + name + ':' + port);
		for (i=proxies.length-1; i>=0; i--) {
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
}

function setProxy(port, ip, clandestine) {
	var prollyproxy = {};
	// listen to port.
	// when someone connects, match their IP to the nominated list of hosts to serve for them
	// so that anything that comes to a vhost can be sent back to them as required
   	net.createServer(function(s){
		console.log('creating proxy server');
		remote_ip = s.remoteAddress;
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


exports.setupServer = setupServer
exports.setProxy = setProxy
exports.getProxy = getProxy

exports.server = webserver_app;

