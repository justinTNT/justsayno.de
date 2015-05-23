options =

	# if you're running in production, set the IP address, cos you might have, or upgrade to, multiple IP#s.
	# Assuming that your development environment has not, you can leave this undefined there.
	ip : "127.0.0.1"

	# this 'secret' password is put in the stream of proxy names.
	clandestine : "You'll>never<guess,"

	# apps served from this server:
	# map domain names to app names.
	apps : [
		dname: "saymay.loc"
		appname: "static"
	,
		dname: ["territorytoday.loc"]
		appname: "tt"
	,
		dname: ["alice.loc"]
		appname: "alice"
	,
		dname: ["darwin.loc"]
		appname: "darwin"
	,
		dname: ["darwinmail.loc"]
		appname: "dmail"
	]

	# webserver entry point.
	# default values, pull in Command Line Arguments
	# start webserver, then start proxy (one of server/ client)
	server_port : 80
	proxy_port : 8780
	proxy_name : ""
	proxies : []

	admintoemail : "just@isnt.so"			# administrivia destination address
	adminfromemail : "just@saymay.be"		# site admin email source address

	mailopts :
		ses:							# auth and config for AWS SES
			AWSAccessKeyID: ''
			AWSSecretKey: ''

		sendmail: user: "just@justat.at"		# sendmail uses user creds. this is the 'from' addr

		smtp:						# not yet (re)implemented
			host: "mail.justat.at"
			port: 587
			auth:
				user: "just@justat.at"
				pass: "thisisnotmyrealpassword"

exports.options = options
