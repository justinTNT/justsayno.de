var ft = require('../../justsayno.de/fieldtools');
var bpost = require('./schema/blogpost').name;
var paginate = require('../../common/paginate/paginate');


module.exports = function(env){

	var BlogPost = env.db.model(bpost);


    var paginConfig = {
        nakedRoute: '/'									// special clean route for first page
        , skipRoute: '/list/'							// route for subsequent pages: /list/:skip
        , model: BlogPost								// the model we're paginating data from
        , query: {}										// select parameters
        , fields: 'name title teaser created_date'		// fields to extract
        , sort: '-created_date'							// sort parameters
        , limit: 5										// number of items per page
    };
    paginate.setupPagLst(env, paginConfig, function(req, res, docs, objs){
        _.each(docs, function(o) {
            o.link = '/'+o.name;
            o.month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][o.created_date.getMonth()];
            o.date = o.created_date.getDate();
        });

        var which_fields = ['title', 'teaser', 'month', {date:'day', link:'link.href' }];
        if (docs) objs.eachpost = ft.translateFields(docs, which_fields);

        var temps = [{selector:'#maintab', filename:'showall.htm'}
                    ];

        env.respond(req, res, env.basetemps, temps, objs);
    });


	env.app.get('/:post', function(req, res, next){

		var which_fields = ['title', 'body'];
		BlogPost.find({name:req.params.post}, ft.toStr(which_fields), function(err, docs) {
			if (! docs.length) res.redirect('/list/0');
			else {
				var temps = [{selector:'#maintab', filename:'showpost.htm'}
							];
				env.hook['comments'](req.params.post, function(err, c) {
					if (err) c=0;
					var all_objs = {post: ft.translateFields(docs[0], which_fields)};
					all_objs.commentcnt = c;
					env.respond(req, res, env.basetemps, temps, all_objs);
				});
			}
		});

	});

};

