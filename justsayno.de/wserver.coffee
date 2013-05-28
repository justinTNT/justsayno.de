fs = require 'fs'
os = require 'os'
net = require 'net'
http = require 'http'
express = require 'express'
mongoose = require 'mongoose'
mongoStore = require('connect-mongo')(express)

temptools = require './temptools'
schemetools = require './schemetools'

proxies = {}


# configureAppEnv - setup some basic app functionality,

configureAppEnv = (e) ->
	clandestine = "#{e.clandestine}_" + os.hostname() + "_#{e.appname}"
	if e.targetapp then clandestine = "#{clandestine}_#{e.targetapp}"
	temptools.configureTemplates e
	e.app.use express.staticCache()
	e.app.use express.bodyParser()
	e.app.use express.cookieParser(clandestine)
	e.app.use express.cookieSession key: if e.targetapp then "#{e.targetapp}-admin.sid" else "#{e.appname}.sid"
	e.app.use '/browser/', express.static "#{e.dir}/browser/"
	e.app.use express.logger {immediate:true, format: '[:date] ' + e.appname + ' :remote-addr ":method :url" :status ":referrer"'}
	e['hook'] = []
	e.app


setupFavico = (ea, done) ->
	d = "#{__dirname}/../apps/#{ea.env.appname}/browser/favicon.ico"
	fs.stat d, (err, stat) ->
		if err
			ea.app.use express.favicon()
		else
			ea.app.use express.favicon(d)
		done ea


###
** configure templates; setup serving of browser files (scripts, css, favicon)
** and ensuring that ajax pages get a basic skeleton.
** ---------------
** it's important to know where all the routing is,
** cos the first attempt to add a route cements the middleware priority
** much easier if it's all in one spot, so:
###
setupRoutes = (ea) ->
	# don't do anything until we've hijacked the favico
	setupFavico ea, (a) ->

		# first, these serve up the compiled js and css

		a.app.get "/#{a.env.appname}.css", (req, res) ->
			res.contentType 'text/css'
			res.send a.env.cssstring

		a.app.get "/#{a.env.appname}.js", (req, res) ->
			res.contentType 'text/javascript'
			res.send a.env.scriptplatestring

		# then comes routing for any plugins
		if a.env.plugins
			for plugin in a.env.plugins  # some common modules return a hook, or array of hooks
				a.env.hook[plugin] = require("../common/#{plugin}/#{plugin}.js") a.env  # common routing (server script)

		a.setRoutes?()		# now we add all the app-specific routes

		###
		* and finally, this makes sure that ajax pages serve up the skeleton
		* in the case of where there is nothing else to server at the route
		* i.e. it's all built on the client by a script
		###
		if a.env.urlprefix
			matchx = new RegExp "^\/#{a.env.urlprefix}\/"
			a.app.get matchx, (req, res) ->
				a.env.respond req, res, a.env.basetemps
			matchx = new RegExp "^\/#{a.env.urlprefix}$"
			a.app.get matchx, (req, res) ->
				a.env.respond req, res, a.env.basetemps
			a.app.get /\/$/, (req, res) ->
				res.redirect "\/#{a.env.urlprefix}"
		else a.app.get /\/$/, (req, res) ->
			a.env.respond req, res, a.env.basetemps


###
 * setupServer - prepare to listen for http connections
 * -----------
 *  all trafic comes through the closure in here.
 *  if it's not for one of our apps, we check the proxies.
 *  if it's
 *  port : port to listen for HTTP trafic
 *  applist : list of apps served by this webserver
 *  ip : optional IP to listen on - in case our box has more than one
 *  passon : an object containing properties that should be passed on to each app env
###
webserver_app = null
setupServer = (port, applist, ip, setuid, passon) ->
	webserver_app = express()
	admdb = mongoose.createConnection schemetools.URIofDB passon.mongopts, 'justsayadmin'
	dbs = [admdb]

	for app in applist
		n = app.appname
		if not _.isArray app.dname
			app.dname = [app.dname]
	
		eachapp = require('../apps/' + n + '/' + n + '_app')
		e=eachapp.env

		if (e)							# not static ...
			e.appname = n
			e.url = app.dname[0]

			for key of passon
				if not e[key]
					e[key] = passon[key]

			eachapp.app = configureAppEnv e
			setupRoutes eachapp

			this_admin = require('./admin/admin') e, admdb
			this_admin.app = configureAppEnv this_admin.env
			setupRoutes this_admin
			webserver_app.use express.vhost("admin." + e.url, this_admin.app)

			schemetools.configureDBschema admdb, e
			e.db = mongoose.createConnection schemetools.URIofDB(e.mongopts, n)
			dbs.push e.db

		for dname in app.dname
			webserver_app.use express.vhost(dname, eachapp.app)
			webserver_app.use express.vhost("www." + dname, eachapp.app)


	webserver_app.use express.logger()
	webserver_app.use express.errorHandler({ dumpExceptions: true, showStack: true })

	###
	// see above, we .use vhosts for all matching apps.
	// if we match in this catch-all, its cos the host is not one we're serving.
	// either it's one we're proxying for, or it's a mystery host ...
	###
	webserver_app.all '*', (req, res) ->
		if proxies and (p = proxies[req.header('Host')])
			proxy = http.createClient 80, p
			proxy.addListener 'error', ->
				console.log 'Proxy connection failed'
				proxies[req.header('Host')] = undefined
			proxy_request = proxy.request req.method, req.url, req.headers
			proxy_request.addListener 'response', (proxy_response) ->
				proxy_response.addListener 'data', (chunk) ->
					res.write chunk, 'binary'
				proxy_response.addListener 'end', ->
					console.log "passing #{req.url} response from " + req.header('Host') + ' via proxy.'
					res.end()
				proxy_response.addListener 'error', (e) ->
					console.log 'proxy_response error'
					console.log e
					console.log proxy_response
					res.end()
				res.writeHead proxy_response.statusCode, proxy_response.headers
			req.addListener 'data', (chunk) ->
				proxy_request.write chunk, 'binary'
			req.addListener 'end', ->
				console.log "PASSING #{req.url} request for " + req.header('Host') + ' via proxy.'
				proxy_request.end()
			req.addListener 'error', (e) ->
				console.log 'req error'
				console.log e
				console.log req
				proxy_request.end()
		else if req.headers.connection isnt 'keep-alive'
			console.log 'also seen: ' + JSON.stringify(req.headers)
			###
			* note: see that return above? that's when we found a proxy to send it to.
			*       if we got down this far, its cos we have an un-handled request.
			*       not worth dying over, but probably worth logging ...
			###

	console.log 'listen to ' + (if ip then ip else 'localhost') + " on #{port}"
	webserverserver = webserver_app.listen port, ip
	webserverserver.on 'listening', ->
		if setuid
			console.log "stepping down to #{setuid}"
			process.setuid setuid

	process.on "SIGINT", ->
		console.log 'closing webservers ...'

		if proxy_server
			proxy_server.close()
			proxy_server = null

		for i in [0..dbs.length]
			dbs[i].close()

		if (webserverserver)
			webserverserver.close()
			webserverserver = null

		console.log ' ... webservers closed.'

	webserverserver.on 'close', ->
		console.log 'webserver closing'
	proxy_server.on 'close', ->
		console.log 'proxyserver closing'


getProxy = (name, port, clandestine, proxies) ->
	# connect to name:port, to let the proxy server know where we are
	c = net.createConnection port, name
	c.on 'connect', (s) ->
		console.log "connected to proxy server at #{name}:#{port}"
		for i in [proxies.length-1...0]
			c.write proxies[i] + ' '
		c.write clandestine
	c.on 'end', (e) ->
		console.log 'config connection to proxy server ended.'
		c.end()
	c.on 'error', (e) ->
		console.log 'config connection to proxy server failed.'
		throw e


proxy_server = null
setProxy = (port, ip, clandestine) ->
	prollyproxy = {}
	# listen to port.
	# when someone connects, match their IP to the nominated list of hosts to serve for them
	# so that anything that comes to a vhost can be sent back to them as required
	proxy_server = net.createServer((s) ->
		console.log 'creating proxy server'
		remote_ip = s.remoteAddress
		s.on 'data', (d) ->
			aStr=String(d).split(' ')
			for i in [0..aStr.length]
				if (aStr[i] is clandestine)
					for d in prollyproxy
						proxies[d] = prollyproxy[d]
						console.log "authorised redirecting : #{d} to #{proxies[d]}"
					s.end()
				else if (aStr[i].length)
					console.log "redirection requested for : #{aStr[i]} to #{remote_ip}"
					prollyproxy[aStr[i]] = remote_ip
		s.on 'error', (e) ->
			console.log 'proxy read error!'
	).listen(port, ip)


module.exports =
	setupServer:setupServer
	setProxy:setProxy
	getProxy:getProxy
	server:webserver_app

