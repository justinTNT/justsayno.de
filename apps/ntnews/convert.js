var mysql = require('mysql');
var article = require('./schema/article').name;
var mongoose = require('mongoose');

var jsdom = require('jsdom')
  , myWindow = jsdom.jsdom().createWindow()
  , $ = require('jquery').create(myWindow)
  , _ = require('underscore')
  ;


var thism = mongoose.createConnection('mongodb://localhost/ntnews');
var Article = thism.model(article);



var TEST_DATABASE = 'newsbase';
var TEST_TABLE = 'articles';
var client = mysql.createClient({
  user: 'newsuser',
  password: 'n3w5p455',
});



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


function strip(o){
	var t = o['title'];
	var b = o['body'];
	var $b = $('<html>'+b+'</html>');
    var obj_id = o['_id'];
	var aid = o['aid'];
	var source = o['source'];
	var x = '';
    try {
		var $p = $b.find('p:first');
		if ($p.length)
			x = $p.text();
    } catch(err) {
    }
    
	t = t.replace(/[\t\n\r]/g, ' ');
	while (t.length && t.charAt(0) == ' ')
		t = t.substr(1, t.length-1);
	while (t.length && t.charAt(t.length-1) == ' ')
		t = t.substr(0,t.length-1);

console.log(aid + ' ' + t);
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
    
    o.body = $b.html();
    return o;
}


function dumpNext(resarr, cb) {

	if (resarr.length) {

		var c = strip(new Article(resarr.shift()));
		c.save(function(err){
			if (err) {
				// if it is a validation error, send something sensible back to the client...
				throw err;
			}
			dumpNext(resarr, cb);
		});
		
	} else {
		cb();
	}
}


function getNext(skip) {

	console.log('getting : ' + skip);
	client.query( 'SELECT aida as aid, title, author as attrib, source, body, section as tag, adate as art_date FROM '+TEST_TABLE+' LIMIT '+skip+',100',
		function selectCb(err, results, fields) {
			if (err) {
				throw err;
			}
			if (results.length) {
				if (results.length == 100) skip += 100;
				else skip = 0;
				setTimeout(function(){
					dumpNext(results, function() {
						if (skip) getNext(skip);
					});
				}, 4444);
			}
		}
	);
}

client.query('USE '+TEST_DATABASE);
getNext(2942);
