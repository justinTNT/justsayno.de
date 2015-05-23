var ft = require('../../justsayno.de/fieldtools');
var story = 'Story';


module.exports = function(env){

	var Story = env.db.model(story);

	// either define here, or use env.basetemps
	var basetemps = [ {selector:'#boilerplate-container', filename:'basewatch.htm'}
					];

	function showlist(req, res) {
		Story.find({}, 'name title teaser created_date')
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

	function loadStory(story, req, res, next) {
		var which_fields = ['title', 'body'];
		Story.findOne({name:story}, ft.toStr(which_fields), function(err, doc) {
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
		loadStory('front', req, res, next);
	});


	env.app.get('/:post', function(req, res, next){
		loadStory(req.params.post, req, res, next);
	});


};

