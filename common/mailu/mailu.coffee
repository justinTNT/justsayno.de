mailuser = require('./schema/mailuser').name
crypto = require "../../justsayno.de/crypto"

request = require 'request'	# used for easydns api
MailgunJS = require 'mailgun-js'	# used for mailgun api

bodyParser = require 'body-parser'
jsonParser = bodyParser.json()
urlencodedParser = bodyParser.urlencoded extended: true

module.exports = (env)->
	Mailer = require("../../justsayno.de/mail")(env)

	Guest = env.db.model 'Guest'		# piggy-back on auth module
	Mailuser = env.db.model mailuser

	# utilities

	checkFullyConfirmed = (handle, cb)->
		return cb false unless handle?.length
		Mailuser.findOne handle: handle, (err, user) ->
			cb not err and user and not user.code

	getUser2Confirm  = (handle, cb) ->
		return cb null unless handle?.length
		Mailuser.findOne handle: handle, (err, user) ->
			if not err and user?.code
				cb user
			else
				cb null
				
	# routes

	env.AJAXredirect = (req, res, path)->
		if req.xhr then res.send path, 303
		else res.redirect path

	mustHaveHandle = (req, res, next)->
		if not req.session?.user?.handle?.length
			return env.AJAXredirect req, res, "/register"
		next()

	mustHaveThisHandle = (req, res, next)->
		mustHaveHandle req, res, ->
			unless req.session?.user?.handle is req.params.handle
				return env.AJAXredirect req, res, '/register'
			next()

	doesntHavePass = (req, res,next)->
		if req.session?.user?.pass?.length
			return env.AJAXredirect req, res, "/user/#{req.session.user.handle}"
		next()


	env.app.get '/registration', mustHaveHandle, doesntHavePass, (req,res,next)->
		temps = [{selector:'#maindiv', filename:'registration.jade'}]
		env.respond req, res, env.basetemps, temps,
			handle: req.session.user.handle
			emaildomain:env.emaildomain


	env.app.get '/deregister', mustHaveHandle, doesntHavePass, (req,res,next)->
		handle = req.session.user.handle
		checkFullyConfirmed handle, (alreadyConfirmed) ->
			if alreadyConfirmed
				return env.AJAXredirect req, res, '/logout'

			Mailuser.remove { handle: handle }, ->
				Guest.remove { handle: handle }, ->
					env.AJAXredirect req, res, '/logout'


	env.app.get '/register', doesntHavePass, (req, res, next)->
		handle = req.session.user?.handle
		checkFullyConfirmed handle, (alreadyConfirmed) ->
			if alreadyConfirmed
				return env.AJAXredirect req, res, "/user/#{handle}"

			getUser2Confirm handle, (user) ->
				if user
					return env.AJAXredirect req, res, "/confirm"
				else if handle?.length
					return env.AJAXredirect req, res, "/registration"

				# fall thru: no user to confirm rego to continue
				temps = [{selector:'#maindiv', filename:'rego.jade'} ]
				env.respond req, res, env.basetemps, temps, emaildomain:env.emaildomain


	env.app.get '/user/:handle', mustHaveThisHandle, (req,res,next)->
		getUser2Confirm req.session.user.handle, (user) ->
			if user
				return res.redirect '/confirm'
			temps = [{selector:'#maindiv', filename:'user.jade'} ]
			env.respond req, res, env.basetemps, temps,
				handle: req.params.handle
				emaildomain: env.emaildomain

	env.app.get '/confirm', mustHaveHandle, (req, res, next)->
		getUser2Confirm  req.session.user.handle, (user) ->
			unless user
				env.AJAXredirect req, res, "/user/#{req.session.user.handle}"

			email = user.newemail or user.email

			mailClient = Mailer.connect()
			Mailer.send mailClient,
				to:      env.admintoemail
				subject: "waiting for confirmation of new user #{user.handle} <#{email}>on #{env.appname}"
				html:    "<p>waiting for confirmation of new user #{user.handle} <#{email}><br></p>"
			, (err, resp) ->
				if err
					console.log "alerting admin of potential user => mail fail: #{err}"
				else
					console.log "alerted #{env.admintoemail} about potential user #{user.handle}<#{email}> on #{env.appname}"

			temps = [{selector:'#maindiv', filename:'confirm.jade'} ]
			return env.respond req, res, env.basetemps, temps,
				handle:      user.handle
				email:       email
				code:        user.code
				emaildomain: env.emaildomain


	env.app.get '/edit/:handle', mustHaveThisHandle, (req, res, next)->
		temps = [{selector:'#maindiv', filename:'edit.jade'}]
		Mailuser.findOne handle: req.session.user.handle, (err, user) ->
			if not err and user
				return env.respond req, res, env.basetemps, temps,
					handle:              req.params.handle
					emaildomain:         env.emaildomain
					"email.placeholder": user.email
			# fall thru to redirect
			env.AJAXredirect req, res, "/user/#{req.session.user.handle}"


	# respond to post from mailhook (cloudmailin)

	env.app.post '/confirm', jsonParser, (req, res, next)->
		subj = req.body.headers?.Subject
		themail = req.body.headers?.From

		if not themail
			console.dir 'unrecognised mailhook:'
			console.dir req.body
			return res.status(500).send "error"

		# strip down sending email address from header
		i = themail.indexOf '<'
		unless i < 0
			themail = themail.substr i+1
			if (i = themail.indexOf '>') > 0
				themail = themail.substr 0, i

		_doConfirm = (res, user)->
			_doConfirmCode subj, user, (user)->
				_doAddMailMap user, ->
					return res.status(200).send "OK"

		# get guest record for that email
		Mailuser.findOne newemail: themail, (err, user) ->
			if not err and user then return _doConfirm res, user
			Mailuser.findOne email: themail, (err, user) ->
				if err or not user
					console.log "User #{themail} not found from confirmation email:"
				_doConfirm res, user


	# send confirmation email to recently created forward route

	sendRegConfMail = (user)->
		mailClient = Mailer.connect()
		msg =
			to: "#{user.handle} <#{user.handle}@#{env.emaildomain}>"
			subject: "Your #{env.emaildomain} account has been verified"
			html: """
			<p>You are now receiving emails sent to #{user.handle}@#{env.emaildomain}</p>
			"""
		if env.carddomain then msg.html += """
		<p>
		You can now use the same handle and password to setup a virtual business card at
		<a href='#{env.carddomain}'>#{env.carddomain}/#{user.handle}</a>
		</p>
		"""
		Mailer.send mailClient, msg, (error, resp) ->
			if error
				console.dir msg
				console.log "error sending confirmation for #{user.handle}"
				console.dir error
				if resp and resp.length then console.log "got response: #{resp}"

		Mailer.send mailClient, {
			to: env.admintoemail
			subject: "new user on #{env.appname}"
			html: "<p>New user #{user.handle}<br></p>"
		}, (err, resp) ->
			if err then console.log "alerting admin of new user => mail fail: #{err}"
			else console.log "alerted #{env.admintoemail} about new user on #{env.appname}"

	# use API to add mailmap
	_doEachMap =
		Mailgun: (user, cb)->	# use Mailgun API to add mailmap
			operation =
				expression: "match_recipient(\"#{user.handle}@#{env.emaildomain}\")"
				action: "forward(\"#{user.email}\")"
				description: user.handle
			mailgun = new MailgunJS
				apiKey:env.MapPass
				domain: env.emaildomain
			if user.mailgunID then op = 'update'
			else op = 'create'
			mailgun.routes(user.mailgunID)[op] operation, (err, body)->
				if not err and body?.route?.id
					user.mailgunID = body.route.id
					sendRegConfMail user
					# will fall through save the user with the new ID
					return cb? null
				console.log "mailgun API did not create new map"
				console.dir op
				console.dir operation
				console.dir err
				console.dir body
				return cb? err

		EasyDNS: (user, cb)-> # use EasyDNS API to add mailmap
			operation =
				host: "@"
				alias: user.handle
				destination: user.email
				active: "1"
			connection =
				url: "http://sandbox.rest.easydns.net/mail/maps/#{env.emaildomain}"
				auth:
					user: env.MapUser
					pass: env.MapPass
			request.post connection, operation, (err, resp, body)->
				if err or resp.statusCode isnt 201
					console.log "EasyDNS API did not create new map"
					console.dir connection
					console.dir operation
					console.dir err
					console.dir resp
				else
					sendRegConfMail user
					# will fall through save the user with the new ID
				return cb? err

	# add mailmap
	# if we're successful adding a mail map from the user object
	# run the cb and look for another one to do (might be one failed previously?)
	_doAddMailMap = (user, cb)->
		if not user
			console.log "Error: can't map empty user"
			return cb?()
		_doEachMap[env.MapAPI] user, (err)->
			unless err
				_doCompleteUser user, ->
					Mailuser.findOne {code:null, complete:$ne:true}, (err, user) ->
						if err
							console.log "Error looking for incomplete users to map"
							return console.dir err
						if not user then return
						_doAddMailMap user
			cb?()


	# confirm code in subject
	_doConfirmCode = (subj, user, cb)->
		if subj.indexOf(user?.code) < 0
			console.log "confirmation email subject '#{subj}' - code not found:"
			console.dir user
			return cb null

		# now remove code (and update email if necessary)
		user.code = null
		if user.newemail
			user.email = user.newemail
			user.newemail = null
		user.complete = false	# haven't done mailmap update yet
		user.save (err)->
			unless err then return cb? user # all good? continue thru to add new mapping
			console.log "ERROR completing mailuser record"
			console.log err
			console.dir user
			return cb null

	# mark user as complete
	_doCompleteUser = (user, cb)->
		if not user or user.complete then return cb?()
		user.complete = true
		user.save (err)->
			if err
				console.log "ERROR completing mailuser record"
				console.dir err
				console.dir user
			Guest.findOne {handle: user.handle}, (err, guest)->
				if err or not guest
					console.log "that's weird: didn't expect error completing #{user.handle}"
					console.dir err
					return cb?()
				guest.verified = true
				delete guest.expireOnNoVerify
				guest.save (err)->
					if err
						console.log "ERROR updating guest record as verified"
						console.dir err
						console.dir guest
					cb?()

	_addVerCode = (user, req, res)->
		verificationCode = ''
		verificationChars = '0123456789abcdefghijklmnopqrstuvwxyz0123456789'
		for i in [0..7]
			index = Math.floor(Math.random()*verificationChars.length)
			verificationCode += verificationChars.substring(index, index+1)
		user.code = verificationCode
		user.save (err)->
			if err
				msg = "ERROR writing new mailuser record "
				console.log msg
				console.dir user
				return res.send msg, 404
			else env.AJAXredirect req, res, '/confirm'

	_addPassword = (guest, pass, doMore)->
		guest.salt = crypto.generateSalt()
		guest.pass = crypto.hashPassword pass, guest.salt
		guest.save (err)->
			if err
				msg = "ERROR updating guest record with password"
				console.log msg
				console.dir guest
				return res.send msg, 404
			else doMore()

	_verifyEmail = (email, cb)->
		if not email?.length then return cb "Email must have length"
		return cb null

	_verifyPass = (pass, cb)->
		if not pass?.length then return cb "Pass must have length"
		return cb null

	env.app.post '/dorego', mustHaveHandle, urlencodedParser, (req, res, next)->
		email = req.body.email
		pass = req.body.password
		_verifyEmail email, (err)->
			if err then return res.send "email", 400
			_verifyPass pass, (err)->
				if err then return res.send "pass", 400
				Mailuser.findOne email: email, (err, user) ->
					if not err and user then return res.send "Email already used", 409
					Guest.findOne {handle:req.session.user.handle}, (err, guest) ->
						if err or not guest then return res.send "Guest not found", 404
						_addPassword guest, pass, ->
							user = new Mailuser
								handle: req.session.user.handle
								email: email
							_addVerCode user, req, res

	env.app.post '/doedit', mustHaveHandle, urlencodedParser, (req, res, next)->
		email = req.body.email
		pass = req.body.pass
		_verifyEmail email, (err)->
			if email and err then return res.send "invalid email", 400
			_verifyPass pass, (err)->
				if pass and err then return res.send "invalid password", 400
				Mailuser.findOne {handle:req.session.user.handle}, (err, user) ->
					if err or not user then res.send "Mail user not found", 404
					user.newemail = req.body.email
					if req.body.pass?.length
						Guest.findOne {handle:req.session.user.handle}, (err, guest) ->
							if err or not guest then return res.send "Guest not found", 404
							_addPassword guest, req.body.pass, ->
								if req.body.email?.length then _addVerCode user, req, res
					else if req.body.email?.length then _addVerCode user, req, res
					else res.send "no edits found", 404


	env.app.post '/preregister', urlencodedParser, (req,res,next)->
		if req.session?.user?.handle?.length
			return env.AJAXredirect "/user/#{req.session.user.handle}"
		unless req.body.handle.match /^[a-z0-9_\.]+$/
			return res.send 'Not a valid email address', 409
		Guest.findOne {handle:req.body.handle}, (err, guest) ->
			if err then return res.send "failed to investigate guest to preregister", 400
			if guest then return res.send 'That user already exists', 409
			guest = new Guest
				handle: req.body.handle
				verified: false
			guest.save (err)->
				if err
					console.log "ERROR adding new user #{guest.handle}"
					delete req.session.user
					guest = {}
				else
					req.session.user = _.clone(guest)
					console.log "initiated new user #{guest.handle}"
				env.respond req, res, guest

