mailer = require "nodemailer"
ses = require "node-ses"

module.exports = (env) ->

	connect: ->
		if env.mailopts.ses then return mailer.createTransport "SES", env.mailopts.ses
		if env.mailopts.sendmail then return mailer.createTransport "Sendmail"
		if env.mailopts.smtp then return mailer.createTransport "SMTP", env.mailopts.smtp
		return null

	send: (client, msg, cb)->
		if not client then return cb -1, "no mail client configured"
		if not msg.from then msg.from = env.adminfromemail
		client.sendMail msg, (error, resp)->
			client.close() # shut down the connection pool, no more messages
			cb error, resp
