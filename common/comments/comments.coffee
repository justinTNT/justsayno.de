ft = require "../../justsayno.de/fieldtools"
commm = require("./schema/comment").name
_ = require "underscore"

module.exports = (env) ->
	
	Mailer = require("../../justsayno.de/mail")(env)

	# this function is returned when the module is applied
	# so that the including app can use it to add a comment count to other requests
	countComments = (s, cb) ->
		s = s?.replace(/\//g, " ")
		Comment.count {subject:s}, cb

	# create the comment (optional parent comment)
	comment = (req, res, p) ->
		o =
			subject: req.params.subject
			name: req.session.user.handle
			link: req.session.user.link
			comment: req.body.comment

		if p then o.parent = p
		c = new Comment(o)
		c.save (err) ->
			if err # if it is a validation error, send something sensible back to the client...
				res.send "failed to save comment: #{err}", 404
				throw err
			mailClient = Mailer.connect()
			Mailer.send mailClient, {
				to: env.admintoemail
				subject: "new comment on #{env.appname}"
				html: "<p>New comment from: #{o.name}<br> #{o.comment}<br> at #{o.subject}</p>"
			}, (err, resp) ->
				if err then console.log "alerting new comment => mail fail: #{err}"
				else console.log "alerted #{env.admintoemail} about comment on #{env.appname}"
				res.send "OK" # if the alert email fails, don't bother visitors with the err msg


	Comment = env.db.model(commm)
	env.app.get "/:subject/comments", (req, res) ->
		which_fields = ["subject", "name", "comment", "link", "_id", "parent"]
		Comment.find {subject:req.params.subject}, ft.toStr(which_fields), (err, docs) ->
			if docs?.length then o = ft.translateFields(docs, which_fields)
			else o = null
			env.respond req, res, null, null, o


	env.app.post "/:subject/comment", (req, res) ->
		comment req, res

	env.app.post "/:subject/comment/:parent", (req, res) ->
		comment req, res, req.params.parent

	countComments
