express = require "express"
env =
	staticurl: "isnt.so"
	app: express()
	plugins: ["auth", "comments", "codeblg"]
	dir: __dirname
	basetemps: [
		selector: "#boilerplate-container"
		filename: "blog.jade"
	]
	urlprefix:'de'
	customplate:'hardcode.tpl'
	auth:
		facebook:
			clientID: 'GOES_HERE'
			clientSecret: 'GOES_HERE'
		google:
			clientID: 'GOES_HERE'
			clientSecret: 'GOES_HERE'
		twitter:
			consumerKey: 'GOES_HERE'
			consumerSecret: 'GOES_HERE'
	s3:
		key: 'GOES_HERE'
		secret: 'GOES_HERE'
		bucket: 'isnt.so'

exports.env = env
