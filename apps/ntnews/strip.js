var jsdom = require('jsdom')
  , myWindow = jsdom.jsdom().createWindow()
  , $ = require('jquery').create(myWindow)
  , _ = require('underscore')
  ;

var article = require('./schema/article').name;
var mongoose = require('mongoose');

var thism = mongoose.createConnection('mongodb://localhost/ntnews');
var Article = thism.model(article);


function checkTitles (x, t) {
var i=0, j=0;
var xl=x.length, tl=t.length;
var c, d;

	x=x.toLowerCase();
	t=t.toLowerCase();
	while (1) {
		if (j == tl) return false; // match
		do c=x.charAt(i++);
		while (i<xl && (c<'a' || c>'z'));
		do d=t.charAt(j++);
		while (j<tl && (d<'a' || d>'z'));
		if (((d>='a' && d<='z') || (c>='a' && c<='z')) && d != c) {
			break;
		}
	}
	return true;
}

		Article.find({}).skip(2960)
			.run(function(err, docs) {
				if (err) throw err;
				for (key in docs) {
					var t = docs[key]['title'];
					var b = docs[key]['body'];
					var $b = $('<html>'+b+'</html>');
					var obj_id = docs[key]['_id'];
					var aid = docs[key]['aid'];
					var source = docs[key]['source'];
					var x = '';
try {
					var $p = $b.find('p:first');
					if ($p.length)
						x = $p.text();
} catch(err) {
}

/*
						x = x.replace(/[\t\n\r]/g, ' ');
						while (x.length && x.charAt(0) == ' ')
							x = x.substr(1, x.length-1);
						while (x.length && x.charAt(x.length-1) == ' ')
							x = x.substr(0, x.length-1);
*/

						t = t.replace(/[\t\n\r]/g, ' ');
						while (t.length && t.charAt(0) == ' ')
							t = t.substr(1, t.length-1);
						while (t.length && t.charAt(t.length-1) == ' ')
							t = t.substr(0,t.length-1);

console.log(aid + ' ' + obj_id + ' ' + t);
						if (checkTitles(x,t) == 0) {
							$p.remove();
							$p = $b.find('p:first');
						}
						if (source.length) {
							if ($p.text().indexOf(source) >= 0) {
								$p.remove();
							} else {
								source=source.toUpperCase();
								if ($p.text().indexOf(source) >= 0) {
									$p.remove();
								}
							}
						}
					Article.update({_id:obj_id}, {body:$b.html()}, function(err){
console.log(obj_id + ' update callback');
						if (err) {
console.log($b.html());
							// if it is a validation error, send something sensible back to the client...
							throw err;
						}
					});
console.log(obj_id + ' update called');
				}
			});

