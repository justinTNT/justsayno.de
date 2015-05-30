express = require "express"
env =
	staticurl: "isnt.so"
	app: express()
	plugins: ['auth', 'mailu']
	dir: __dirname
	emaildomain: 'darwin.email'
	carddomain: 'da-rw.in'
	adminfromemail: 'd@r-w.in'
	MapUser: "app"
	MapPass: "YOUR_MAILGUN_KEY_HERE"
	MapAPI: "Mailgun"
	basetemps: [
		selector: "#boilerplate-container"
		filename: "dmail.jade"
	]
	s3:
		key: 'YOUR_S3_KEY_HERE'
		secret: 'YOUR_S3_SECRET_HERE'
		bucket: 'isnt.so'
		region: 'ap-southeast-2'

exports.env = env
exports.setRoutes = -> require('./dmail_routes') env

