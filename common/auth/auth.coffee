crypto = require("crypto")
guest = require("./schema/guest").name
module.exports = (env) ->
	
	mailer = require("../../justsayno.de/mail")(env)

	Guest = env.db.model(guest)

	class EmailVerification
		constructor: (secret)->
			if secret
				@cipher = crypto.createCipher("aes-256-cbc", secret)
				@decipher = crypto.createDecipher("aes-256-cbc", secret)
		encrypt: (text)->
			if text
				crypted = @cipher.update(text, "utf8", "hex")
				crypted += @cipher.final("hex")
			crypted
		decrypt: (text)->
			if text
				dec = @decipher.update(text, "hex", "utf8")
				dec += @decipher.final("utf8")
			dec


	#	 returns user object (minus the pass)
	#		 or	 user name (if user not found)
	#		 or	 empty string (if password doesn't match)
	authenticate = (name, pass, cb) ->
		Guest.findOne {handle: name}, (err, doc) ->
			throw err	if err
			if not doc then return cb name
			if not doc.salt and pass isnt doc.pass then return cb ""
			else if crypto.hashPassword(pass, doc.salt) isnt doc.pass then return cb ""
			delete doc.pass
			delete doc.salt
			cb doc._doc

	
	# returns : user name (if user already in db)
	# 		or	 email (if email already in db)
	# 		otherwise nothing
	validateNewRego = (name, email, cb) ->
		Guest.find {handle:name}, (err, docs) ->
			if err then throw err
			if docs.length then return cb name
			Guest.find {email:email}, (err, docs) ->
				if err then throw err
				if docs.length is 0 then cb()
				else cb email

	sendVerwDoc = (env, handle, doc) ->
		g = doc._doc
		expireDate = new Date()
		delay = expireDate.getTime()
		expireDate.setDate expireDate.getDate() + 2
		doc.expireOnNoVerify = expireDate
		doc.save (err) ->
			if err then throw err
		delay = expireDate.getTime() - delay
		setTimeout (->
			Guest.findOne {handle:handle}, (err, doc) ->
				if doc and doc.expireOnNoVerify
					doc.expireOnNoVerify = null
					doc.save (err) ->
						if err then throw err
		), delay
		encrypter = new EmailVerification(g.email)
		encoded = encrypter.encrypt(g.pass)
		confirmlink = "#{env.url}/confirm/#{handle}/#{encoded}"
		mailClient = mailer.connect()
		msg =
			to: "#{g.handle} <#{g.email}>"
			subject: "Please confirm your account"
			html: "<p>Click on this link to verify your account:<br>" + "<a href='" + confirmlink + "'>" + confirmlink + "</a></p>" + "<p>This link will expire in two days</p>"
		mailer.send mailClient, msg, (error, resp) ->
			if error
				console.dir msg
				console.log "error sending confirmation for #{handle} to #{g.email}"
				console.dir error
				if resp and resp.length then console.log "got response: #{resp}"

	sendVerification = (env, handle, doc) ->
		unless doc
			Guest.findOne {handle:handle}, (err, doc)->
				if doc then sendVerwDoc env, handle, doc


	
	#	on startup, set timeouts for all unexpired guests

	Guest.find {expireOnNoVerify: $ne: null}, (err, docs)->
		if not err and docs.length
			docs.forEach (err, i) ->
				g = docs[i]
				expireDate = new Date()
				delay = expireDate.getTime()
				expire = g.expireOnNoVerify.getTime()
				if expire < delay
					delay = 0
				else
					delay = expire - delay
				setTimeout (->
					Guest.findOne {handle:g.handle}, (err, doc)->
						if not err and doc
							if doc.expireOnNoVerify
								Guest.remove {_id:doc._id}, (err)->
									throw err	if err
				), delay


	env.app.get "/logout", (req, res) ->
		console.log "got logout" # jTNT remove me
		if req.session.user
			console.dir req.session.user # jTNT remove me
			if req.session.user.remember
				delete req.session.user.pass
			else
				delete req.session.user
			console.dir req.session.user # jTNT remove me
			req.session.save()
		console.log "sending OK" # jTNT remove me
		res.send "OK", 200


	env.app.post "/login", (req, res) ->
		authenticate req.body.login, req.body.password, (u) ->
			if typeof u isnt "object" then return res.send u, 404
			req.session.user = _.clone(u)
			req.session.user.remember = req.body.remember
			delete u.pass

			if req.body.remember
				req.session.cookie.maxAge = 86400000000
			else
				req.session.cookie.expires = false	if req.session.cookie
			env.respond req, res, null, null, u


	env.app.get "/silent_login", (req, res) ->
		if not req.session.user then return res.send "", 404
		if req.session.user.pass
			env.respond req, res, null, null, req.session.user
		else
			res.send req.session.user.handle, 404


	env.app.post "/register", (req, res) ->
		validateNewRego req.body.login, req.body.email, (u) ->
			if u then return res.send u, 404
			password_salt = crypto.generateSalt()
			g = new Guest(
				handle: req.body.login
				email: req.body.email
				salt: password_salt
				algo: crypto.hashAlgorithm
				pass: crypto.hashPassword req.body.password, password_salt
				verified: false
			)
			g.save (err) ->
				if err
					console.log "ERROR adding new user #{g.handle}"
					delete req.session.user
					g = {}
				else
					req.session.user = _.clone(g)
					sendVerification env, g.handle
					console.log "added new user #{g.handle} & sent confirmation to #{req.body.email}"
				delete g.pass

				env.respond req, res, null, null, g


	env.app.post "/verify/:user", (req, res) ->
		Guest.findOne {handle:req.params.user}, (err, doc) ->
			sendVerification env, req.params.user, doc	if not err and doc


	env.app.get "/verify/:user", (req, res) ->
		Guest.findOne {handle:req.params.user}, (err, doc) ->
			if not err and doc
				unless doc.verified
					sendVerification env, req.params.user, doc
					res.send "not found", 404


	env.app.get "/confirm/:user/:encoded_pass", (req, res) ->
		Guest.findOne {handle:req.params.user}, (err, doc) ->
			if err or not doc then return res.send "Invalid user", 404
			decrypter = new EmailVerification(doc.email)
			decoded = decrypter.decrypt(req.params.encoded_pass)
			unless decoded is doc.pass
				return res.send "Invalid confirmation code " + decoded, 404
			unless doc.expireOnNoVerify
				req.session.user = _.clone(doc._doc)
				sendVerification env, req.params.user, doc
				return res.send "confirmation code expired - a new code has been sent to your email", 404
			doc.expireOnNoVerify = null
			doc.verified = true
			doc.save (err, docs) ->
				throw err	if err
			req.session.user = _.clone(doc._doc)
			res.redirect "/"

