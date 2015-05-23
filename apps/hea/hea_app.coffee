express = require "express"
env =
	staticurl: "saymay.be"
	app: express()
	dir: __dirname
	plugins: []
	basetemps: [
		selector: "#boilerplate-container"
		filename: "hea.jade"
	]
	s3:
		key: 'GOES_HERE'
		secret: 'GOES_HERE'
		bucket: 'dphon.es'

exports.setRoutes = ->
	require('./hea_routes') env

exports.env = env
