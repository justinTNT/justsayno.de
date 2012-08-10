var options = {};


// if you're running in production, set the IP address, cos you might have, or upgrade to, multiple IP#s.
// Assuming that your development environment has not, you can leave this undefined there.
//
//options.ip = 'prolly not required in dev';
options.ip = '111.67.13.184';


// this 'secret' password is put in the stream of proxy names.
options.clandestine="You'll>never<guess,";


// apps served from this server:
// map domain names to app names.

options.apps = [	{ dname:'staticurl.com', appname:'static' }
				  , { dname:'siteurl.com', appname:'sitename' }
	];


// webserver entry point.
// default values, pull in Command Line Arguments
// start webserver, then start proxy (one of server/ client)

options.server_port=80;	// default http : 8080 for dev
options.proxy_port=8780; 
options.proxy_name='';
options.proxies = [];

options.adminemail = 'justin@justat.in';

options.mailopts = {
	host: 'mail.justat.at'
  , port: 587
  , auth: {
		user: 'just@justat.at'
	  , pass: 'thisisnotmyrealpassword'
	}
};

exports.options = options;

