
var ft = require('../../justsayno.de/fieldtools');
var commm = require('./schema/comment').name;
var mailer = require('nodemailer');
var _ = require('underscore')

module.exports = function(env){

	var Comment = env.db.model(commm);

	// this function is returned when the module is applied
	// so that the including app can use it to add a comment count to other requests
	function countComments(subject, cb) {
		Comment.count({subject:subject}, cb);
	}


	function comment(req, res, p) {
		var o = {subject:req.params.subject
				, name:req.session.user.login
				, link:req.session.user.link
				, comment:req.body.comment};
		if (p) o.parent = p;
		var c = new Comment(o);
		c.save(function(err){
			if (err) {
				// if it is a validation error, send something sensible back to the client...
                res.send('failed to save comment: ' + err, 404);
				throw err;
			}

			var smtpTransport = mailer.createTransport("SMTP", _.clone(env.mailopts));

			smtpTransport.sendMail( {
					from: 'welcome@larrakia.com'
					, to:env.adminemail
					, subject:'new comment on ' + env.appname
					, html: "<p>New comment from: " + o.name + "<br>" + o.comment + "<br> at " + o.subject + "</p>"
				}, function(err, resp) {
					smtpTransport.close(); // shut down the connection pool, no more messages
						if (err) {
							console.log('alerting new comment => mail fail: ' + err);
						}
						else console.log('alerted ' + env.adminemail + ' about comment on ' + env.appname);
						res.send('OK'); // if the alert email fails, don't bother visitors with the err msg
				}	);
		});
	}


	env.app.get('/:subject/comments', function(req, res){

		var which_fields = ['subject', 'name', 'comment', 'link', '_id', 'parent'];
		Comment.find({subject:req.params.subject}, which_fields, function(err, docs) {
			var o = null;
			if (docs.length) {
				o = ft.translateFields(docs, which_fields);
			}
			env.respond(req, res, null, null, o);
		});

	});

	env.app.post('/:subject/comment', function(req, res){
		comment(req, res);
	});

	env.app.post('/:subject/comment/:parent', function(req, res){
		comment(req, res, req.params.parent);
	});


	return countComments;
};

