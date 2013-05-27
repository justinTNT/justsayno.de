options =

	# if you're running in production, set the IP address, cos you might have, or upgrade to, multiple IP#s.
	# Assuming that your development environment has not, you can leave this undefined there.
	ip : "ip-10-248-15-206.ap-southeast-2.compute.internal"

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
	adminemail : "justin@justat.in"
	mailopts :
		host: "mail.justat.at"
		port: 587
		auth:
			user: "just@justat.at"
			pass: "thisisnotmyrealpassword"

exports.options = options
