express = require "express"
env =
	staticurl: "isnt.so"
	app: express()
	plugins: ['auth', 'mailu']
	dir: __dirname
	emaildomain: 'darwin.email'
	MapUser: "YOUR_EASYDNS_USER_HERE"
	MapPass: "YOUR_EASYDNS_PASS_HERE"
	MapAPI: "EasyDNS"
	basetemps: [
		selector: "#boilerplate-container"
		filename: "dmail.jade"
	]
	s3:
		key: 'YOUR_S3_KEY_HERE'
		secret: 'YOUR_S3_SECRET_HERE'
		bucket: 'isnt.so'

exports.env = env
exports.setRoutes = -> require('./dmail_routes') env
