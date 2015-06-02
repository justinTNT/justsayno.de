var ft = require('../../justsayno.de/fieldtools');
var article = require('./schema/article').name;
var paginate = require('../../common/paginate/paginate');

module.exports = function(env){

	var Article = env.db.model(article);



	// either define here, or use env.basetemps
	var basetemps = [ {selector:'#boilerplate-container', filename:'ntnews.htm'}
					];


	function showFront(req, res) {
		Article.find({}).sort('-front').limit(10).exec(function(err, dox) {
            var o = {};
            if (err) {
				throw err;
			}

				o.top_title = dox[0].title;
				o.top_link = '/article/' + dox[0]._id;
				o.top_teaser = dox[0].tease;
				o.waste_title = dox[1].title;
				o.waste_link = '/article/' + dox[1]._id;
				o.waste_teaser = dox[1].tease;
				o.waste2_title = dox[2].title;
				o.waste2_link = '/article/' + dox[2]._id;
				o.waste2_teaser = dox[2].tease;
				o.mining_title = dox[3].title;
				o.mining_link = '/article/' + dox[3]._id;
				o.mining_teaser = dox[3].tease;
				for (var i=0; i<6; i++) {
					o['title' + (i+1)] = dox[i+4].title;
					o['link' + (i+1)] = '/article/' + dox[i+4]._id;
				}
				var which_fields = ['top_title', 'top_teaser', 'waste_title', 'waste_teaser', 'waste2_title', 'waste2_teaser',
					'mining_title', 'mining_teaser', 'title1', 'title2', 'title3', 'title4', 'title5', 'title6', 
					{
						top_link:'top_link.href', waste_link:'waste_link.href', waste2_link:'waste2_link.href',
						mining_link:'mining_link.href', link1:'link1.href', link2:'link2.href', link3:'link3.href',
						link4:'link4.href', link5:'link5.href', link6:'link6.href'
					}];
				var all_objs = {frontpage: ft.translateFields(o, which_fields)};
	
				var temps = [{selector:'#maintab', filename:'mainbit.htm'}
							];
				env.respond(req, res, basetemps, temps, all_objs);
		});
	}

	env.app.get('/breaking.php', function(req, res){		// legacy
		showFront(req, res);
    });

	env.app.get('/breaking', function(req, res){
		showFront(req, res);
    });

	env.app.get('/', function(req, res){
		showFront(req, res);
    });


	env.app.get('/article/:thid', function(req, res){

		var which_fields = ['title', 'attrib', 'source', 'body', 'art_date', 'tag'];
		Article.findOne({_id:req.params.thid}, ft.toStr(which_fields), function(err, docs) {
				var temps = [{selector:'#maintab', filename:'showart.htm'}
							];
				if (docs) docs._doc.link = '/'+docs.tag;
				which_fields.push({link:'link.href'});
				env.hook['comments'](req.params.thid, function(err, c) {
					if (err) c=0;
					var all_objs = {article: ft.translateFields(docs, which_fields)};
					all_objs.commentcnt = c;
					env.respond(req, res, basetemps, temps, all_objs);
				});
		});

	});


    var paginConfig = {
        nakedRoute: '/:section'					// route for first and subsequent page
        , model: Article						// the model we're paginating data from
        , query: {tag: 'req.params.section'}	// select parameters
        , fields: 'title art_date'				// fields to extract
        , sort: '-art_date'						// sort parameters
        , limit: 25								// number of items per page
    };
    paginate.setupPagLst(env, paginConfig, function(req, res, docs, objs, subsequent_flag){
        var lastyear=0, lastmonth=99;
        _.each(docs, function(o) {
            o.link = '/article/'+o._id;
            var t = o.art_date.getMonth();
            if (t != lastmonth) {
                lastmonth = t;
                o.month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][t];
                t = o.art_date.getFullYear();
				if (t != lastyear) {
					o.year = t;
					lastyear = t;
				}	
            }
        });

        var which_fields = ['title', 'year', 'month', { link:'link.href' }];
		if (objs) {
	        objs['eachart'] = ft.translateFields(docs, which_fields);
		}

        var temps = [];
        if (!subsequent_flag) {
            temps.push({selector:'#maintab', filename: 'showall.htm'});
        }
        temps.push({selector:'.more', filename: 'showmore.htm'});
        env.respond(req, res, basetemps, temps, objs);
    });


};

