fs = require 'fs'
os = require 'os'
net = require 'net'
http = require 'http'
express = require 'express'
helmet = require 'helmet'
mongoose = require 'mongoose'

session = require 'express-session'
MongoStore = require('connect-mongo') session
cookieParser = require 'cookie-parser'
methodOverride = require 'method-override'
favicon = require 'serve-favicon'
createStatic = require 'connect-static'
vhost = require 'vhost'
logger = require 'morgan'
errorHandler = require 'errorhandler'


temptools = require './temptools'
schemetools = require './schemetools'

proxies = {}


# configureAppEnv - setup some basic app functionality,

configureAppEnv = (e, dbname) ->
	clandestine = "#{e.clandestine}_" + os.hostname() + "_#{e.appname}"
	if e.targetapp then clandestine = "#{clandestine}_#{e.targetapp}"
	temptools.configureTemplates e

	# session support in expressjs, using a Mongo backend
	# access session variables via req.session.varname
	e.app.use cookieParser()
	e.app.use session
		secret: 'keybored cat'
		store: new MongoStore(url: dbname)
		saveUninitialized: true
		resave: true

	# don't broadcasting webserver info to potential attackers
	e.app.disable 'x-powered-by'

	e.app.use helmet.xframe()
	e.app.use helmet.noSniff()
	e.app.use helmet.noCache()
	e.app.use methodOverride()

	d = "#{e.dir}/browser"
	fs.stat d, (err, stat) ->
		return if err
		createStatic { dir: d }, (err, middleware) ->
			if err then throw err
			else e.app.use '/browser', middleware

	e.app.use logger '[:date] ' + e.appname + ' :remote-addr ":method :url" :status ":referrer"', {immediate:true}
	e['hook'] = []
	e.app


setupFavico = (ea, done) ->
	d = "#{__dirname}/../apps/#{ea.env.appname}/browser/favicon.ico"
	fs.stat d, (err, stat) ->
		ea.app.use favicon(d) unless err
		done()


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
	setupFavico ea, ->

		# first, these serve up the compiled js and css

		ea.app.get "/#{ea.env.appname}.css", (req, res) ->
			res.contentType 'text/css'
			res.send ea.env.cssstring

		ea.app.get "/#{ea.env.appname}.js", (req, res) ->
			res.contentType 'text/javascript'
			res.send ea.env.scriptplatestring

		# then comes routing for any plugins
		if ea.env.plugins
			for plugin in ea.env.plugins  # some common modules return a hook, or array of hooks
				filename = "../common/#{plugin}/#{plugin}.coffee"
				try ea.env.hook[plugin] = require(filename) ea.env  # common routing (server script)
				catch err then console.dir err
		ea.setRoutes?()		# now we add all the app-specific routes

		###
		* and finally, this makes sure that ajax pages serve up the skeleton
		* in the case of where there is nothing else to server at the route
		* i.e. it's all built on the client by a script
		###
		if ea.env.urlprefix
			matchx = new RegExp "^\/#{ea.env.urlprefix}\/"
			ea.app.get matchx, (req, res) ->
				ea.env.respond req, res, ea.env.basetemps
			matchx = new RegExp "^\/#{ea.env.urlprefix}$"
			ea.app.get matchx, (req, res) ->
				ea.env.respond req, res, ea.env.basetemps
			ea.app.get /\/$/, (req, res) ->
				res.redirect "\/#{ea.env.urlprefix}"
		else ea.app.get /\/$/, (req, res) ->
			ea.env.respond req, res, ea.env.basetemps

		ea.app.get '*', (req, res)->
			msg = "cant find #{req.url} from #{req.headers.host}"
			console.dir msg
			res.status(404).send msg


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
	dbname = schemetools.URIofDB passon.mongopts, 'justsayadmin'
	admdb = mongoose.createConnection dbname
	dbs = [admdb]

	for app in applist
		n = app.appname
		if not _.isArray app.dname
			app.dname = [app.dname]
	
		eachapp = require "../apps/#{n}/#{n}_app"
		e=eachapp.env

		if (e)							# not static ...
			e.appname = n
			e.url = app.dname[0]

			for key of passon
				if not e[key]
					e[key] = passon[key]

			eachapp.app = configureAppEnv e, dbname

			this_admin = require('./admin/admin') e, admdb
			this_admin.app = configureAppEnv this_admin.env, dbname
			setupRoutes this_admin
			webserver_app.use vhost("admin.#{e.url}", this_admin.app)

			do (eachapp) ->
				schemetools.configureDBschema admdb, eachapp.env, ->
					eachapp.env.db = mongoose.createConnection schemetools.URIofDB(eachapp.env.mongopts, eachapp.env.appname)
					dbs.push eachapp.env.db
					setupRoutes eachapp

		for dname in app.dname
			webserver_app.use vhost(dname, eachapp.app)
			webserver_app.use vhost("www.#{dname}", eachapp.app)


	webserver_app.use logger '[:date] SERVER :remote-addr ":method :url" :status ":referrer"', {immediate:true}
	webserver_app.use errorHandler({ dumpExceptions: true, showStack: true })

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

		proxy_server?.close()
		proxy_server = null

		for i in [0...dbs.length]
			dbs[i].close()

		if (webserverserver)
			webserverserver.close()
			webserverserver = null

		console.log ' ... webservers closed.'

	webserverserver.on 'close', ->
		console.log 'webserver closing'
	proxy_server?.on 'close', ->
		console.log 'proxyserver closing'


getProxy = (name, port, clandestine, proxies) ->
	return unless port
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
	return unless port
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
	setupServer: setupServer
	setProxy:    setProxy
	getProxy:    getProxy
	server:      webserver_app

