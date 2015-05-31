var ft = require('../../justsayno.de/fieldtools');
var story = 'Page';


module.exports = function(env){

	var Page = env.db.model(story);

	// either define here, or use env.basetemps
	var basetemps = [ {selector:'#boilerplate-container', filename:'ipan.htm'}
					];

	function showlist(req, res) {
		Page.find({}, 'name title teaser created_date')
					.sort('-created_date')
					.exec( function(err, docs) {
			_.each(docs, function(o) {
				o.link = '/'+o.name;
				o.month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][o.created_date.getMonth()];
				o.date = o.created_date.getDate();
			});
			var which_fields = ['title', 'teaser', 'month', {date:'day', link:'link.href' }];
			var all_objs = {eachstory: ft.translateFields(docs, which_fields)};
			var temps = [{selector:'#maintab', filename:'showall.htm'}
						];
			env.respond(req, res, basetemps, temps, all_objs);
		});
	}

	function loadFront(story, req, res, next) {
		var which_fields = ['title', 'body'];
		Page.findOne({name:story}, ft.toStr(which_fields), function(err, doc) {
			if (err || !doc) showlist(req,res);
			else {
				var temps = [{selector:'#maintab', filename:'showfront.htm'}
							];
				env.respond(req, res, basetemps, temps, {story: ft.translateFields(doc, which_fields)});
			}
		});
	}

	function loadPage(story, req, res, next) {
		if (story == 'front' || story == 'signup')
			return loadFront(story, req, res, next);
		var which_fields = ['title', 'body'];
		Page.findOne({name:story}, ft.toStr(which_fields), function(err, doc) {
			if (err || !doc) showlist(req,res);
			else {
				var temps = [{selector:'#maintab', filename:'showstory.htm'}
							];
				env.hook['comments'](req.params.post, function(err, c) {
					if (err) c=0;
					var all_objs = {story: ft.translateFields(doc, which_fields)};
					all_objs.commentcnt = c;
					env.respond(req, res, basetemps, temps, all_objs);
				});
			}
		});
	}


	env.app.get("/", function(req, res, next){
		loadFront('front', req, res, next);
	});


	env.app.get('/:post', function(req, res, next){
		loadPage(req.params.post, req, res, next);
	});


};

