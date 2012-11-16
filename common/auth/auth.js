
var crypto = require('crypto');
var guest = require('./schema/guest').name;
var mailer = require('nodemailer');


module.exports = function(env) {

var Guest = env.db.model(guest);


	/*
	 * returns : user object,
	 * 		or   user name (if user not found)
	 * 		or   empty string (if password doesn't match)
	 */
	function authenticate(name, pass, cb) {
		Guest.findOne({handle:name}, function(err, doc) {
			if (err) throw err;
			if (!doc) {
				cb(name);
			} else if (doc.pass == pass) {
				delete doc.pass;
				cb(doc._doc);
			} else {
				cb('');
			}
		});
	}

	/*
	 * returns : user name (if user already in db)
	 * 		or   email (if email already in db)
	 * 		otherwise nothing
	 */
	function validateNewRego(name, email, cb) {
		Guest.find({handle:name}, function(err, docs) {
			if (err) throw err;
			if (docs.length == 0) {
				Guest.find({email:email}, function(err, docs) {
					if (err) throw err;
					if (docs.length == 0) cb();
					else cb(email);
				});
			} else {
				cb(name);
			}
		});
	}



	var EmailVerification = function(secret) {
		this.cipher = crypto.createCipher('aes-256-cbc', secret);
		this.decipher = crypto.createDecipher('aes-256-cbc', secret);
	};
	EmailVerification.prototype.encrypt = function(text) {
		var crypted = this.cipher.update(text,'utf8','hex');
		crypted += this.cipher.final('hex');
		return crypted;

	};
	EmailVerification.prototype.decrypt = function(text) {
		var dec = this.decipher.update(text,'hex','utf8');
		dec += this.decipher.final('utf8');
		return dec;
	};


    function sendVerwDoc(env, h, doc) {
		var g = doc._doc;

		var expireDate = new Date();
		var delay = expireDate.getTime();
		expireDate.setDate(expireDate.getDate()+2);
		doc.expireOnNoVerify = expireDate;
		doc.save(function(err){ if (err) throw err; });
		delay = expireDate.getTime() - delay;
		setTimeout(function(){
			Guest.findOne({handle:h}, function(err, doc) {
				if (doc) {
					if (doc.expireOnNoVerify) {
						doc.expireOnNoVerify = null;
						doc.save(function(err){ if (err) throw err; });
					}
				}
			});
		}, delay);

		var encrypter = new EmailVerification(g.email);
		var encoded = encrypter.encrypt(g.pass);
		var confirmlink = env.url + "/confirm/" + h + "/" + encoded;

		var smtpTransport = mailer.createTransport("SMTP", _.clone(env.mailopts));
		var msg = {
				from: 'website@' + env.url
				, to: g.handle + ' <' + g.email + '>'
				, subject:'Please confirm your account'
				, html: "<p>Click on this link to verify your account:<br>"
					+ "<a href='" + confirmlink + "'>" + confirmlink + "</a></p>"
					+ "<p>This link will expire in two days</p>"
			};
		smtpTransport.sendMail(msg,
			function(error, resp){
				smtpTransport.close(); // shut down the connection pool, no more messages
				if (!error) {
				} else {
					console.log('error sending confirmation for ' + h + ' to ' + g.email)
					console.log(error);
					console.log('got response: ' + resp);
				}
			});


    }
    
	function sendVerification(env, h, doc) {
        if (doc) sendVerwDoc(env, h, doc);
        else {
    		Guest.findOne({handle:h}, function(err, doc) {
	    		if (doc) sendVerwDoc(env, h, doc);
		    });
        }
    }


	/*
	** on startup, set timeouts for all unexpired guests
	*/

	Guest.find({expireOnNoVerify:{$ne:null}}, function(err, docs) {
		if (!err && docs.length) {
			docs.forEach(function(err, i){
				var g=docs[i];
				var expireDate = new Date();
				var delay = expireDate.getTime();
				var expire = g.expireOnNoVerify.getTime();
				if (expire < delay) delay=0;
				else delay = expire - delay;
				setTimeout(function(){
					Guest.findOne({handle:g.handle}, function(err, doc) {
						if (!err && doc) {
							if (doc.expireOnNoVerify) {
								Guest.remove({_id:doc._id}, function(err){
										if (err) {
											throw err;
										}
									});
							}
						}
					});
				}, delay);
			});
		}
	});


	env.app.get('/logout', function(req,res) {
		if (req.session.user) {
			if (req.session.user.remember)
				delete req.session.user.pass;
			else delete req.session.user;
		}
		res.send('OK', 200);
	});


	env.app.post('/login', function(req,res) {
		authenticate(req.body.login, req.body.password, function(u){
			if (typeof u == 'object') {
				req.session.user = _.clone(u);
				req.session.user.remember = req.body.remember;
				delete u.pass;
				if (req.body.remember) {
 					req.session.cookie.maxAge = 86400000000;
				} else {
 					if (req.session.cookie) req.session.cookie.expires = false;
				}
				env.respond(req, res, null, null, u);
			} else {
				res.send(u, 404);
			}
		});
	});

	env.app.get('/silent_login', function(req,res) {
		if (req.session.user) {
			if (req.session.user.pass) {
				env.respond(req, res, null, null, req.session.user);
			} else {
				res.send(req.session.user.handle, 404);
			}
		} else {
			res.send('', 404);
		}
	});

	env.app.post('/register', function(req,res) {
		validateNewRego(req.body.login, req.body.email, function(u){
			if (u) {
				res.send(u, 404);
			} else {
				var g = new Guest({
							handle:req.body.login
							, email:req.body.email
							, pass:req.body.password
							, verified:false
						});
				g.save(function(err){
					if (err) {
						console.log('ERROR adding new user ' + g.handle);
						delete req.session.user;
						g = {};
					} else {
						req.session.user = _.clone(g);
						sendVerification(env, g.handle);
						console.log('added new user ' + g.handle + ',  and sent confirmation to ' + req.body.email);
					}
					delete g.pass;
					env.respond(req, res, null, null, g);
				});
			}
		});
	});

	env.app.post('/verify/:user', function(req,res) {
    	Guest.findOne({handle:req.params.user}, function(err, doc) {
			if (!err && doc) {
        		sendVerification(env, req.params.user, doc);
			}
    	});
	});

    env.app.get('/verify/:user', function(req,res) {
        Guest.findOne({handle:req.params.user}, function(err, doc) {
			if (!err && doc) {
                if (doc.verified) res.send('OK');
        		else {
                    sendVerification(env, req.params.user, doc);
                    res.send('not found', 404);
        		}
			}
    	});
	});

	env.app.get('/confirm/:user/:encoded_pass', function(req,res) {
		Guest.findOne({handle:req.params.user}, function(err, doc) {
			if (!err && doc) {
				var decrypter = new EmailVerification(doc.email);
				var decoded = decrypter.decrypt(req.params.encoded_pass);
				if (decoded != doc.pass) {
					res.send('Invalid confirmation code ' + decoded, 404);
				} else if (!doc.expireOnNoVerify) {
					req.session.user = _.clone(doc._doc);
					sendVerification(env, req.params.user, doc);
					res.send('confirmation code expired - a new code has been sent to your email', 404);
				} else {
					doc.expireOnNoVerify=null;
					doc.verified=true;
					doc.save(function(err,docs){
						if (err) throw err;
					});
					req.session.user = _.clone(doc._doc);
					res.redirect('/');
				}
			} else res.send('Invalid user', 404);
		});
	});

};

