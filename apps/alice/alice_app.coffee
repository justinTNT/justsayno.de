express = require "express"
env =
	staticurl: "isnt.so"
	app: express()
	plugins: ['auth', 'mailu']
	dir: __dirname
	emaildomain: 'alicesprin.gs'
	MapUser: "app"
	MapPass: "YOUR_MAILGUN_KEY_HERE"
	MapAPI: "Mailgun"
	basetemps: [
		selector: "#boilerplate-container"
		filename: "alice.jade"
	]
	s3:
		key: 'YOUR_S3_KEY_HERE'
		secret: 'YOUR_S3_SECRET_HERE'
		bucket: 'isnt.so'

exports.env = env
exports.setRoutes = -> require('./alice_routes') env
