express = require 'express'

env =
	staticurl: "isnt.so"
	app: express()
	plugins: ['auth', 'comments', "wblg"]
	dir: __dirname
	basetemps: [ {selector:'#boilerplate-container', filename:'blog.jade'} ]
	s3:
		key: 'GOES_HERE'
		secret: 'GOES_HERE'
		bucket: 'isnt.so'
		region: 'ap-southeast-2'

exports.env = env
