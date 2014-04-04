module.exports = (env)->
	Guest = env.db.model 'Guest'		# piggy-back on auth module


	env.app.get '/registration', (req,res,next)->
		if not req.session?.user?.handle?.length then return res.redirect "/register"
		if req.session?.user?.pass?.length then return res.redirect "/user/#{req.session.user.handle}"
		temps = [{selector:'#main', filename:'registration.jade'}]
		env.respond req, res, env.basetemps, temps, handle: req.session.user.handle

	env.app.get '/deregister', (req,res,next)->
		if req.session?.user?.pass?.length then return res.redirect "/user/#{req.session.user.handle}"
		if not req.session?.user?.handle?.length then return res.redirect "/register"
		Guest.remove {handle:req.session.user.handle}, (err, docs) ->
			res.redirect '/logout'

	env.app.get '/register', (req,res,next)->
		if req.session?.user?.pass?.length then return res.redirect "/user/#{req.session.user.handle}"
		if req.session?.user?.handle?.length then return res.redirect "/registration"
		temps = [{selector:'#main', filename:'rego.jade'} ]
		env.respond req, res, env.basetemps, temps, null

	env.app.get '/user/:handle', (req,res,next)->
		unless req.session?.user?.handle is req.params.handle then return res.redirect '/register'
		temps = [{selector:'#main', filename:'user.jade'} ]
		o = handle: req.params.handle
		env.respond req, res, env.basetemps, temps, o

	env.app.post '/dorego', (req,res,next)->
		if not req.session?.user?.handle?.length then return res.redirect "/register"
		Guest.find {handle:req.session.user.handle}, (err, docs) ->
			if err or docs?.length isnt 1 then return res.send "User not found", 404
			doc.email = req.body.email
			doc.salt = crypto.generateSalt()
			doc.pass = crypto.hashPassword req.body.pass, doc.salt
			doc.save()
			verificationCode = ''
			verificationChars = '0123456789abcdefghijklmnopqrstuvwxyz0123456789'
			for i in [0..7]
				index = Math.floor(Math.random()*verificationChars.length)
				verificationCode += verificationChars.substring[index, index+1]
			u = new Mailuser
				handle: req.session.user.handle
				email: req.body.email
				code: verificationCode
			temps = [{selector:'#main', filename:'confirm.jade'} ]
			env.respond req, res, env,basetemps, temps, u
			u.save()


	env.app.post '/preregister', (req,res,next)->
		if req.session?.user?.handle?.length then return res.redirect "/user/#{req.session.user.handle}"
		unless req.body.handle.match /^[a-z0-9_]+$/
			return res.send 'Not a valid email address', 404
		Guest.find {handle:req.body.handle}, (err, docs) ->
			if err then throw err
			if docs?.length then return res.send 'That user already exists', 404
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
				env.respond req, res, null, null, g
