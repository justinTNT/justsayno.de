options =

	# if you're running in production, set the IP address, cos you might have, or upgrade to, multiple IP#s.
	# Assuming that your development environment has not, you can leave this undefined there.
	ip : "ip-10-240-21-187.ap-southeast-2.compute.internal"

	# this 'secret' password is put in the stream of proxy names.
	clandestine : "You'll>never<guess,"

	# apps served from this server:
	# map domain names to app names.
	apps : [
		dname: "saymay.be"
		appname: "static"
	,
		dname: ["justat.at"]
		appname: "justat"
	,
		dname: ["usba.se"]
		appname: "usbase"
	,
		dname: ["ha-rd.co"]
		appname: "hardcode"
	,
		dname: ["id-ea.li"]
		appname: "idealist"
	,
		dname: ["sp-ec.im"]
		appname: "specimen"
	,
		dname: ["te-rm.in"]
		appname: "terminal"
	,
		dname: ["nonuk.es"]
		appname: "nonukes"
	,
		dname: ["pa.thna.me"]
		appname: "pathname"
	]

	# webserver entry point.
	# default values, pull in Command Line Arguments
	# start webserver, then start proxy (one of server/ client)
	server_port : 80 # default http : 8080 for dev
	proxy_port : 8780
	proxy_name : ""
	proxies : []

	admintoemail : "just@isnt.so"			# administrivia destination address
	adminfromemail : "just@saymay.be"		# site admin email source address

	mailopts :
		ses:							# auth and config for AWS SES
			AWSAccessKeyID: 'AKIAICFLGBIGUIP4WEBA'
			AWSSecretKey: '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'

		sendmail: user: "just@justat.at"		# sendmail uses user creds. this is the 'from' addr

		smtp:						# not yet (re)implemented
			host: "mail.justat.at"
			port: 587
			auth:
				user: "just@justat.at"
				pass: "thisisnotmyrealpassword"

exports.options = options
