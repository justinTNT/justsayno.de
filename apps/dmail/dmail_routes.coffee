mailuser = require('./schema/mailuser').name
crypto = require "../../justsayno.de/crypto"

request = require 'request'


module.exports = (env)->
	Guest = env.db.model 'Guest'		# piggy-back on auth module
	Mailuser = env.db.model mailuser

	mustHaveHandle = (req, res,next)->
		if not req.session?.user?.handle?.length then return res.redirect "/register"
		next()

	doesntHavePass = (req, res,next)->
		if req.session?.user?.pass?.length then return res.redirect "/user/#{req.session.user.handle}"
		next()

	env.app.get '/registration', mustHaveHandle, doesntHavePass, (req,res,next)->
		temps = [{selector:'#main', filename:'registration.jade'}]
		env.respond req, res, env.basetemps, temps,
			handle: req.session.user.handle
			emaildomain:env.emaildomain

	env.app.get '/deregister', mustHaveHandle, doesntHavePass, (req,res,next)->
		Guest.remove {handle:req.session.user.handle}, (err, docs) ->
			res.send '/logout', 303

	env.app.get '/register', doesntHavePass, (req,res,next)->
		if req.session?.user?.handle?.length then return res.redirect "/registration"
		temps = [{selector:'#main', filename:'rego.jade'} ]
		env.respond req, res, env.basetemps, temps, emaildomain:env.emaildomain

	env.app.get '/user/:handle', (req,res,next)->
		unless req.session?.user?.handle is req.params.handle then return res.redirect '/register'
		Mailuser.find {handle:req.session.user.handle}, (err, docs) ->
			if not err and docs?.length is 1
				if not docs[0].complete and docs[0].code?.length
					res.redirect '/confirm'
			temps = [{selector:'#main', filename:'user.jade'} ]
			env.respond req, res, env.basetemps, temps,
				handle: req.params.handle
				emaildomain:env.emaildomain

	env.app.get '/confirm', mustHaveHandle, (req, res, next)->
		Mailuser.find {handle:req.session.user.handle}, (err, docs) ->
			if not err and docs?.length is 1
				if not docs[0].complete and docs[0].code?.length
					temps = [{selector:'#main', filename:'confirm.jade'} ]
					return env.respond req, res, env.basetemps, temps,
						handle: docs[0].handle
						email: docs[0].email
						code: docs[0].code
						emaildomain:env.emaildomain
			# fall thru to redirect
			res.redirect "/user/#{req.session.user.handle}"


	# respond to post from mailhook (cloudmailin)

	env.app.post '/confirm', (req, res, next)->
		subj = req.body.headers.Subject
		themail = req.body.headers.From

		# strip down sending email address from header
		i = themail.indexOf '<'
		unless i < 0
			themail = themail.substr i+1
			if (i = themail.indexOf '>') > 0
				themail = themail.substr 0, i

		# get guest record for that email
		Mailuser.find {email:themail}, (err, docs) ->
			if err or docs?.length isnt 1
				console.log "User not found on confirmation email:"
				console.dir req.body.headers
				return -1
			_doConfirmCode subj, docs[0], (doc)->
				_doAddDNSmailMap doc, (doc)->
					_doCompleteUser doc


	# use DNS API to add mailmap
	_doEachDNSmap  = (doc, cb)->
		operation =
			host: "@"
			alias: doc.handle
			destination: doc.email
			active: "1"
		connection =
			url: env.DNSurl
			auth:
				user: env.DNSuser
				pass: env.DNSpass
		request.post connection, operation, (err, resp, body)->
			if not err and resp.statusCode is 201 then return cb?()
			console.log "DNS API did not create new map"
			console.dir connection
			console.dir operation
			console.dir err
			console.dir resp

	# add mailmap
	# if we're successful adding a mail map from the user object
	# run the cb and look for another one to do (might be one failed previously?)
	_doAddDNSmailMap = (doc, cb)->
		_doEachDNSmap doc, ->
			cb?()
			Guest.findOne {code:null, complete:{$exists:false}}, (err, doc) ->
				if err
					console.log "Error looking for incomplete users to map"
					return console.dir err
				if not doc then return
				_doAddDNSmailMap doc


	# confirm code in subject
	_doConfirmCode = (subj, doc, cb)->
		if subj.indexOf(doc.code) < 0
			console.log "code '#{subj}' not found in confirmation email subject:"
			console.dir doc
			return -1

		# now remove code and mark this user as complete
		doc.code = null
		doc.save (err)->
			if err
				msg = "ERROR completing guest record"
				console.log err
				console.dir doc
				return -1

			# all good? continue thru to add new mapping
			cb? doc

	# mark user as complete
	_doCompleteUser = (doc)->
		if doc.complete then return
		doc.complete = true
		doc.save (err)->
			if err
				msg = "ERROR completing guest record"
				console.log err
				console.dir doc


	env.app.post '/dorego', mustHaveHandle, (req,res,next)->
		Mailuser.find {email:req.body.email}, (err, docs) ->
			if not err and docs?.length then return res.send "Email already used", 409
			Guest.find {handle:req.session.user.handle}, (err, docs) ->
				if err or docs?.length isnt 1 then return res.send "User not found", 404
				doc = docs[0]
				doc.email = req.body.email
				doc.salt = crypto.generateSalt()
				doc.pass = crypto.hashPassword req.body.pass, doc.salt
				doc.save (err)->
					if err
						msg = "ERROR updating guest record with password"
						console.log msg
						console.dir doc
						return res.send msg, 404
					verificationCode = ''
					verificationChars = '0123456789abcdefghijklmnopqrstuvwxyz0123456789'
					for i in [0..7]
						index = Math.floor(Math.random()*verificationChars.length)
						verificationCode += verificationChars.substring(index, index+1)
					u = new Mailuser
						handle: req.session.user.handle
						email: req.body.email
						code: verificationCode
					u.save (err)->
						if err
							msg = "ERROR writing new mailuser record "
							console.log msg
							console.dir u
							return res.send msg, 404
						else res.send '/confirm', 303

	env.app.post '/preregister', (req,res,next)->
		# this route only comes from the app, so its safe to redirect with a 303
		if req.session?.user?.handle?.length
			return res.send "/user/#{req.session.user.handle}", 303
		unless req.body.handle.match /^[a-z0-9_\.]+$/
			return res.send 'Not a valid email address', 409
		Guest.find {handle:req.body.handle}, (err, docs) ->
			if err then throw err
			if docs?.length then return res.send 'That user already exists', 409
			g = new Guest
				handle: req.body.handle
				verified: false
			g.save (err)->
				if err
					console.log "ERROR adding new user #{g.handle}"
					delete req.session.user
					g = {}
				else
					req.session.user = _.clone(g)
					console.log "initiated new user #{g.handle}"
				env.respond req, res, g

