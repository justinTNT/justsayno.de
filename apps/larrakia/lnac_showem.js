var ft = require('../../justsayno.de/fieldtools');
var story = require('./schema/story').name;
var vacancy = require('./schema/vacancy').name;
var news = require('./schema/news').name;
var paginate = require('../../justsayno.de/paginate');

var util = require('util');
var mailer = require('nodemailer');

	// either define here, or use env.basetemps
	var basetemps = [ {selector:'#boilerplate-container', filename:'larrakia.htm'}
					];

var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function paginateNews(env, cfg) {
	paginate.setupPagLst(env, cfg, function(req, res, docs, objs){
		_.each(docs, function(o) {
			o.link = '/newsitem/'+o.name;
			o.month = months[o.created_date.getMonth()];
			o.date = o.created_date.getDate();
		});

		var which_fields = ['title', 'teaser', 'month', {date:'day', link:'link.href' }];
		objs['eachitem'] = ft.translateFields(docs, which_fields);

		var temps = [{selector:'#maintab', filename:'newslist.htm'}
					];

		env.respond(req, res, basetemps, temps, objs);
	});
}


module.exports = function(env){

	var News = env.db.model(news);
	var Story = env.db.model(story);
	var Vacancy = env.db.model(vacancy);


	env.app.get('/sitemap.xml', function(req, res) {
		var str='<?xml version="1.0" encoding="UTF-8"?> \n';
		str += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

		News.find({}, ['name']).execFind( function(err, docs) {
			if (err) throw err;
			docs.forEach(function(eachd){
				str += '<url>\n';
				str += '<loc>http://' + env.url + '/newsitem/' + eachd.name + '</loc>';
				str += '</url>\n';
			});
			Story.find({}, ['name']).execFind( function(err, docs) {
				if (err) throw err;
				docs.forEach(function(eachd){
					str += '<url>\n';
					str += '<loc>http://' + env.url + '/' + eachd.name + '</loc>';
					str += '</url>\n';
				});
				str += '</urlset>\n';
				res.send(str);
			} );
		} );
	});


	env.app.get("/", function(req, res){
		Story.find({name:'home'}, ['title', 'body', 'created_date'])
					.sort('created_date', -1)
					.execFind( function(err, docs) {
			var which_fields = ['title', 'body'];
			var all_objs = {story: ft.translateFields(docs[0], which_fields)};
			var temps = [{selector:'#maintab', filename:'showfront.htm'}
						];
			env.respond(req, res, basetemps, temps, all_objs);
		});
	});


	env.app.get('/jobs', function(req, res){
		var which_fields = ['title', 'project', 'terms', 'description', 'month', 'date', 'att_name', { att_link: 'att_link.href' } ];
		var temps, all_objs = null;
		Vacancy.find({}).sort('application_date', -1).run(function(err, docs) {
			if (! docs.length) {
				temps = [{selector:'#maintab', filename:'nojobs.htm'}
							];
			} else {
				_.each(docs, function(o) {
					o.month = months[o.application_date.getMonth()];
					o.date = o.application_date.getDate();
					o.att_name = o.attachment;
					o.att_link = 'http://' + env.staticurl + '/' + env.appname + '/upload/' + o.attachment;
					while ((i = o.att_name.indexOf('/')) > 0) {
						o.att_name = o.att_name.substr(i);
					}
				});
				temps = [{selector:'#maintab', filename:'showjobs.htm'}
							];
				all_objs = {job: ft.translateFields(docs, which_fields)};
			}
			env.respond(req, res, basetemps, temps, all_objs);
		});

	});

	env.app.get('/:post', function(req, res, next){
		var which_fields = ['title', 'body'];
		Story.find({name:req.params.post}, which_fields, function(err, docs) {
			if (! docs.length) next();
			else {
				var temps = [{selector:'#maintab', filename:'showstory.htm'}
							];
				env.hook['comments'](req.params.post, function(err, c) {
					if (err) c=0;
					var all_objs = {story: ft.translateFields(docs[0], which_fields)};
					all_objs.commentcnt = c;
					env.respond(req, res, basetemps, temps, all_objs);
				});
			}
		});

	});

	paginateNews(env, {
		nakedRoute: '/news'										// special clean route for first page
		, skipRoute: '/news/list'									// subsequent pages: /news/list/:skip
		, model: News												// the model we're paginating data from
		, query: {}													// select parameters
		, fields: ['name', 'title', 'teaser', 'created_date']		// fields to extract
		, sort: 'created_date' , direction: -1						// sort parameters
		, limit: 5													// number of items per page
	});


	paginateNews(env, {
		nakedRoute: '/news/:cat'									// special clean route for first page
		, skipRoute: '/news/:cat/list'								// subsequent pages: /news/list/:skip
		, model: News												// the model we're paginating data from
		, query: {category:'req.params.cat'}						// select parameters
		, fields: ['name', 'title', 'teaser', 'created_date']		// fields to extract
		, sort: 'created_date' , direction: -1						// sort parameters
		, limit: 5													// number of items per page
	});

	env.app.get('/newsitem/:item', function(req, res, next){
		var which_fields = ['title', 'body', 'created_date'];
		News.find({name:req.params.item}, which_fields, function(err, docs) {
			if (! docs.length) next();
			else {
				_.each(docs, function(o) {
					o.month = months[o.created_date.getMonth()];
					o.date = o.created_date.getDate();
				});

				var which_fields = ['title', 'body', 'month', {date:'day' }];

				var temps = [{selector:'#maintab', filename:'showitem.htm'}
							];
				env.hook['comments'](req.params.post, function(err, c) {
					if (err) c=0;
					var all_objs = {story:ft.translateFields(docs[0], which_fields)};
					all_objs.commentcnt = c;
					env.respond(req, res, basetemps, temps, all_objs);
				});
			}
		});

	});

	env.app.post('/welcome_form', function(req, res, next){

		var smtpTransport = mailer.createTransport("SMTP", _.clone(env.mailopts));
		var o = req.body.submitted;
		var h= "<h1>Welcome to Country</h1>"
		+ "<h3>contact:</h3>"
		+ "<b>name</b> "  + o.contacts.business_name + "<br>"
		+ "<b>address</b> "  + o.contacts.postal_address + "<br>"
		+ "<b>contact</b> "  + o.contacts.contact_person + "<br>"
		+ "<b>fone</b> "  + o.contacts.telephone + "<br>"
		+ "<b>email</b> "  + o.contacts.email + "<br>"
		+ "<b>mobile</b> "  + o.contacts.mobile + "<br>"
		+ "<b>fax</b> "  + o.contacts.fax + "<br>"
		+ "<h3>event:</h3>"
		+ "<b>name</b> "  + o.event_details.event_title + "<br>"
		+ "<b>address</b> "  + o.event_details.address + "<br>"
		+ "<b>date</b> "  + o.event_details.date + " " + o.event_details.hour+":"+o.event_details.minute+o.event_details.ampm+"<br>"
		+ "<b>speaker</b> " + o.speaker + "<br>"
		+ "<b>payment:</b> " + o.payment_details.payment_type
		;

		smtpTransport.sendMail( {
				from: 'welcome@larrakia.com'
				, to:env.adminemail
				, subject:'welcome to country request'
				, html: h
			}, function(err, resp) {
					smtpTransport.close(); // shut down the connection pool, no more messages
					if (err) {
						console.log('welcome to country  => mail fail: ' + err);
						console.dir(req.body);
					}
			} );

		res.send('Thanks for submitting your request.');
	});

	env.app.post('/membership_form', function(req, res, next){

		var smtpTransport = mailer.createTransport("SMTP", _.clone(env.mailopts));
		var o = req.body.submitted;
		var h= "<h1>Membership</h1>"
		+ "<b>name</b>       "  + o.full_name + "<br>"
		+ "<b>title</b>      "  + o.title_eg_mr_mrs_ms_etc + "<br>"
		+ "<b>family</b>     "  + o.family_group + "<br>"
		+ "<b>DoB</b>        "  + o.dob + "<br>"
		+ "<b>gender</b>     "  + o.gender + "<br>"
		+ "<b>email</b>      "  + o.email_address + "<br>"
		+ "<b>home</b>       "  + o.home_address + "<br>"
		+ "<b>post</b>       "  + o.postal_address + "<br>"
		+ "<b>home phone:</b>" + o.home_phone + "<br>"
		+ "<b>work phone:</b>" + o.work_phone + "<br>"
		+ "<b>mobile:</b>    " + o.mobile_phone + "<br>"
		;

		smtpTransport.sendMail( {
				from: 'membership@larrakia.com'
				, to:env.adminemail
				, subject:'LNAC membership form'
				, html: h
			}, function(err, resp) {
					smtpTransport.close(); // shut down the connection pool, no more messages
					if (err) {
						console.log('membership  => mail fail: ' + err);
						console.dir(req.body);
					}
			} );

		res.send('Thanks for submitting your request.');
	});




};

