var ft = require('../../justsayno.de/fieldtools');
var story = require('./schema/story').name;
var paginate = require('../../common/paginate');

var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var path = require('path');




/*
 * ensures dir exists before running f
 */
function runInDir(dir, f) {
	fs.mkdir(dir, 0755, function(err) {
		f();
	});
}

/*
 * this convoluted conclusion to the very simple file load
 * is cos we might want to rename it if it already exists ...
 */
function moveImage(from, to, count) {
	fs.stat(to, function(err, stats){
		var i;
		if (!err) {
			if (count) {
				while (to.charAt(to.length-1) != '_')
					to=to.substr(0, to.length - 1);
				to=to.substr(0, to.length - 1);
			} else count=1;
			to = to + '_' + count.toString();
			count++;
			moveImage(from, to, count);
		} else {
			fs.rename(from, to);
			while ((i = to.indexOf('/')) >= 0)
				to = to.substr(i+1);
		}
	});
}


function looksLikeImage(u) {
	var lastfour = u.substr(u.length-4).toLowerCase();
	var lastfive = u.substr(u.length-5).toLowerCase();
	return (lastfour == '.jpg' || lastfour == '.gif' || lastfour == '.png' || lastfive == 'jpeg');
}


module.exports = function(env){

	var Story = env.db.model(story);


	function doStories (req, res, docs, objs) {
        _.each(docs, function(o) {
            o.link = '/'+ o.created_date.getDate() +'/'+ (o.created_date.getMonth()+1) +'/'+ o.created_date.getFullYear() +'/'+ encodeURIComponent(o.name);
            o.month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][o.created_date.getMonth()];
            o.date = o.created_date.getDate();
        });

        var which_fields = ['title', 'teaser', 'month', {date:'day', link:'link.href', image:'image.src' }];
        objs.eachstory = ft.translateFields(docs, which_fields);

        var temps = [{selector:'#maintab', filename:'showall.htm'}
                    ];

        env.respond(req, res, env.basetemps, temps, objs);
    }


    var taginConfig = {
        nakedRoute: '/tag/:tag'										// route for first and subsequent page
        , model: Story												// the model we're paginating data from
        , query: {tag: 'req.params.tag'}							// select parameters
        , fields: 'name title teaser comment image created_date'		// fields to extract
        , sort: '-created_date'										// sort parameters
        , limit: 5													// number of items per page
    };
    paginate.setupPagLst(env, taginConfig, function(){ console.log('tag'); doStories()});

    var paginConfig = {
        nakedRoute: '/'												// special clean route for first page
        , skipRoute: '/list/'										// route for subsequent pages: /list/:skip
        , model: Story												// the model we're paginating data from
        , query: {}													// select parameters
        , fields: 'name title teaser comment image created_date'		// fields to extract
        , sort: '-created_date'										// sort parameters
        , limit: 5													// number of items per page
    };
    paginate.setupPagLst(env, paginConfig, doStories);
	


	env.app.post('/blog', function(req, res, next){
		var protocol = 'http://';
		var s = {
			comment : req.body.comment
		};

		var today = new Date();
		s.created_date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		s.modified_date = s.created_date;

		if (req.body.url && req.body.url.length) {
			if (looksLikeImage(req.body.url)) {
				s.image = req.body.url;
			} else {
				s.url = req.body.url;
				s.title = req.body.title;
				s.image = req.body.image;
				s.teaser = req.body.description;
			}

			s.name = decodeURIComponent(req.body.url);
			while ((i=s.name.indexOf('/')) >= 0)
				s.name = s.name.substr(i+1);
		}

		if (s.image.length) {
			var img_url = s.image;
			var img_name = path.basename(img_url);
			var ws = fs.createWriteStream(img_name);
			var r = request(img_url);
			var staticpath = process.cwd() + '/apps/static/public/' + env.appname + '/images';
			s.image = protocol + env.staticurl + '/' + env.appname + '/images/' + today.getFullYear() + '/' + (today.getMonth()+1) + '/' + img_name;

			r.on('error', function(){
				console.log("ERROR: reading: piping " + img_name);
			});
			ws.on('error', function(){
				console.log("ERROR: writing: piping " + img_name);
			});
			r.on('end', function(){
				staticpath += '/' + today.getFullYear();
				runInDir(staticpath, function() {
					staticpath += '/' + (today.getMonth()+1);
					runInDir(staticpath, function() {
						staticpath += '/' + img_name;
						moveImage(img_name, staticpath);
					});
				});
			});

			r.pipe(ws, {end:false});
		}

		// tags??
		

		var u = decodeURIComponent(req.body.url);
		if (u.substr(0, 7) != protocol) u = protocol + u;
		var base = u.substr(0, u.substr(7).indexOf('/')+7);
		request(u, function(err, resp, bod){
			if (!err && resp.statusCode == 200) {
				s.body = bod;

				new Story(s).save(function(err, savedsig){
					if (err) throw err;
					res.send('ok', 200);
				});

			} else {
				res.send('bad fetch', 404);
			}
		});
	});


	env.app.get('/consider/:url', function(req, res, next){
		var protocol = 'http://';
		var u = decodeURIComponent(req.params.url);
		if (u.substr(0, 7) != protocol) u = protocol + u;
		var base = u.substr(0, u.substr(7).indexOf('/')+7);
		request(u, function(err, resp, bod){
			if (!err && resp.statusCode == 200) {
				var $ = cheerio.load(bod);
				var payload = { title : $('title').text() };
				$('meta').each(function(){
					switch($(this).attr('property')){
						case 'og:title':
							payload.title = $(this).attr('content');
							break;
						case 'og:description':
							payload.description = $(this).attr('content');
							break;
						case 'og:image':
							payload.image = $(this).attr('content');
							break;
					}
				});

				// rules for missing fbm

				if (!payload.description) {									// first priority para rule: strong
					$('body').find('p').each(function(){
						if (!payload.description) {
							if ($(this).find('strong').length) {
								payload.description = $(this).text();
							}
						}
					});
				}

				if (!payload.image) {										// first priority image rule: biggest width
					var w=50, $w;
					$('body').find('img').each(function(){
						var neww = $(this).attr('width');
						if (neww) {
								neww = parseInt(neww, 10);
								if (neww> w) {
									w = neww;
									$w = $(this);
								}
						}
					});
					if ($w) payload.image = $w.attr('src');
				}

				if (!payload.image) {										// if still no image: find first with alt txt
					$('body').find('img').each(function(){
						if (!payload.image)
							if ($(this).attr('alt'))
								payload.image = $(this).attr('src');
					});
				}

				if (payload.image)
					if (payload.image.substr(0, 7) != protocol)
						payload.image = base + payload.image;

				env.respond(req, res, null, null, [payload]);
			} else {
				res.send('Bad Fetch', 404);
			}
		});
	});


	env.app.get('/:date/:month/:year/:name', function(req, res, next){
		search_date = new Date(req.params.year, req.params.month-1, req.params.date);
		var which_fields = ['title', 'teaser', 'comment', 'tag', {image:'image.src', url:'url.href'}];
		Story.findOne({created_date:search_date, name:req.params.name}, ft.toStr(which_fields), function(err, doc) {
			if (err || !doc) res.redirect('/');
			else {
				var temps = [{selector:'#maintab', filename:'showstory.htm'}
							];
				env.hook['comments'](req.params.post, function(err, c) {
					if (err) c=0;
					var all_objs = {story: ft.translateFields(doc, which_fields)};
					all_objs.commentcnt = c;
					env.respond(req, res, env.basetemps, temps, all_objs);
				});
			}
		});
	});


};

