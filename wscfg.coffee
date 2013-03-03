options =

	# if you're running in production, set the IP address, cos you might have, or upgrade to, multiple IP#s.
	# Assuming that your development environment has not, you can leave this undefined there.
	#
	#	ip : 'prolly not required in dev'
	#	ip : '127.0.0.1'


	# this 'secret' password is put in the stream of proxy names.
	clandestine: "You'll>never<guess,"


	# apps served from this server:
	# map domain names to app names.

	apps: [	{ dname:'static.loc', appname: 'static' }
	{ dname:'ipan.loc', appname:'ipan' }
	]


	# webserver entry point.
	# default values, pull in Command Line Arguments
	# start webserver, then start proxy (one of server/ client)

	server_port: 80	# default http : could choose something bigger for dev
	proxy_port: 8780 
	proxy_name: ''
	proxies: []

	adminemail: 'justin@justat.in'

	mailopts:
		host: 'mail.justat.at'
		port: 587
		auth:
			user: 'just@justat.at'
			pass: 'thisisnotmyrealpassword'

	setuid: 'jtnt'			# user id to step down to after binding

exports.options = options
