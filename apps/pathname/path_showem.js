var ft = require('../../justsayno.de/fieldtools');

var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var path = require('path');


module.exports = function(env){


	env.app.get('/:page', function(req, res, next){

		var all_objs;
		var p = parseInt(req.params.page, 10);
		var which_fields = {image:'image.src', image1:'image1.src', image2:'image2.src', url:'url.href'};

		var temps;
		if (!p) p=2;
		env.hook['comments'](req.params.page, function(err, c) {
			if (err) c=0;
			if (p > 3 && p < 74) {
				temps = {selector:'#maintab', filename:'showpages.htm'};
				all_objs = {image1:'/browser/images/comic/' + p + '.jpg'
								,image2:'/browser/images/comic/' + (p+1) + '.jpg'
								,url:'/' + (p+2)
								};
			}
			else {
				temps = {selector:'#maintab', filename:'showpage.htm'};
				all_objs = {image:'/browser/images/comic/' + p + '.jpg'
								,url:'/' + (p+1)
								};
			}

			all_objs = {eachpage: ft.translateFields(all_objs, which_fields)
						,commentcnt: c};
			env.respond(req, res, env.basetemps, temps, all_objs);
		});
	});


};

