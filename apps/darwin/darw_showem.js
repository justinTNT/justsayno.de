var _ = require('underscore');
var ft = require('../../justsayno.de/fieldtools');
var card = require('./schema/card').name;
var fs = require('fs');


var awesome = {fb: '&#xf082;'
			, twit: '&#xf099;'
			, goog: '&#xf0d5;'
			, street: '&#xf015; &nbsp;'
			, postal: '&#xf003; &nbsp;'
			, phone: '&#xf095; '
			, fax: '<b> f </b> &nbsp;'
			, mobile: '<b>m </b> '
			};

function makeAwesome (i, txt) {
    if (txt.length || social[i])
    	return "<span class='awesome'>" + awesome[i] + "</span>" + txt;
    return '';
}

var social = {fb: 'http://facebook.com/'
			, twit: 'http://twitter.com/'
			, goog: 'http://plus.google.com/'
			};


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
function finishFileLoad(from, to, count, cb) {
	fs.stat(to, function(err, stats){
		var i;
		if (!err) {
			if (count) {
				while (to.charAt(to.length-1) != '_')
					to=to.substr(0, to.length - 1);
				to=to.substr(0, to.length - 1);
			}
			to = to + '_' + count.toString();
			count++;
			finishFileLoad(from, to, count, cb);
		} else {
			fs.rename(from, to);
			while ((i = to.indexOf('/')) >= 0)
				to = to.substr(i+1);
			cb(to);
		}
	});
}


function STRstatdirlist(path, files, stats, cb) {
	if (files.length) {
		var fn = files.shift();
		fs.stat(path+fn, function(err, s) {
			if (!err) {
				var mt = JSON.stringify(s.mtime);
				stats.push({filelist_name:fn, filelist_date:mt, filelist_size:s.size});
			}
			STRstatdirlist(path, files, stats, cb);
		});
	} else cb(stats);
}




module.exports = function(env){

    var Card = env.db.model(card);

    function doc2card (doc) {
		var all_objs = {};
    	if (doc) {
			if (doc.upgrade) {
				all_objs.showpage = { page:doc.page };
			} else {
				delete doc.page;
				all_objs.card = ft.translateFields(doc);
				var c= all_objs.card[0]

				for (var i in c) {
					if (social[i]) {
						if (c[i].length)
							c[i + '.href'] = social[i] + c[i] + '/';
					} else if (i == 'link') {
						if (c[i].length)
							c[i + '.href'] = 'http://' + c[i] + '/';
					} else if (i == 'use_email') {
						if (c[i]) {
							c['email'] = c.contactemail;
							c['email.href'] = 'mailto:' + c.email;
						}
					} else if (i == 'use_dmail') {
						if (c[i] && !c['use_email']) {
							c['email'] = c.name + '@' + env.url;
							c['email.href'] = 'mailto:' + c.email;
						}
					}
					if (awesome[i]) { 
						if (i == 'mobile' && (! c.phone || !c.phone.length)) {
							c[i] = makeAwesome('phone', c[i]);
						} else if (social[i]) {
							if (c[i].length)
								c[i] = makeAwesome(i, '');
							else delete c[i];
						} else if (c[i].length) {
							c[i] = makeAwesome(i, c[i]);
						} else delete c[i];
					}
				}
			}
    	}
    	return all_objs;
    }
    
	function rspnd (e, r, d, q, s, n, t, o) {	// noticed I was doin a lot of this ...
		if (r || !d) return n();
		t = [ {selector:'#mainbit', filename:t} ];
		e.respond(q, s, e.basetemps, t, o);
	}

	function loggedIn (req, h) {
		if (!h) h = req.session.user.handle;
		return req.session.user && req.session.user.pass && req.session.user.handle == h;
	}

	function getMyCard(req, next, f) {
		if (loggedIn(req, req.params.card)) {
			Card.findOne({name: req.session.user.handle}, function(err, doc) {
				if (err || !doc) throw err;
				f(doc._doc);
            });
		} else next();
	}

	function editCard(req, res, next, flip) {
		getMyCard(req, next, function(card) {
			var err=null;
			if (flip === true || (card.upgrade && flip !== false)) {
				var o = { name: card.name, page: card.page };
				rspnd(env, err, card, req, res, next, 'editpage.htm', {editpage: ft.translateFields(o)});
			} else {
				var f = ['url', 'name', 'email']
				card.url = env.url;
				card.email = req.session.user.email;
				var o = { }; //action: 'editcardform.action'};
				for (keys in card) {
					if (_.indexOf(f, keys) == -1) {
						if (keys == 'use_email' || keys == 'use_dmail')
							o[keys] = keys + '.checked';
						else o[keys] = keys + '.value';
					}
				}
				f.push(o);
				rspnd(env, err, card, req, res, next, 'editcard.htm', {editcard: ft.translateFields(card, f)});
			}
		});
	}

	function on404orCreate(req, res, next) {
		if (loggedIn(req, req.params.notfound)) {
			var c = { name: req.params.notfound
                    , contactemail: req.session.user.email
					};
			new Card(c).save(function(err){
				rspnd(env, err, c, req, res, next, 'editcard.htm', {card: ft.translateFields(c)});
			});
		} else {
			Card.findOne({name:'404'}, function(err, doc) {
				rspnd(env, err, doc, req, res, next, 'showcard.htm', doc2card(doc));
			});
		}
	}


	env.app.get('/ck_page_browse', function(req,res) {
		if (! loggedIn(req)) next();
		else {
			var subdir = '/' + env.appname + '/' + req.session.user.handle + '/';
			var topath = process.cwd() + '/apps/static/public' + subdir;
			runInDir(topath, function(){
				fs.readdir(topath, function(err, files) {
					var temps = [{selector:'#maintab', filename:'filebrowse.htm'}];
					var browsebase = [ {selector:'#boilerplate-container', filename:'browse.htm'} ];
					var url = 'http://' + env.staticurl + subdir;
					STRstatdirlist(topath, files, [], function(stats) {
						env.respond(req, res, browsebase, temps, {hidden_url:url, file_list_file:stats}, 'browse.tpl');
					});
				});
			});
		}
	});

	env.app.post('/ck_page_upload', function(req,res) {
		if (! loggedIn(req)) next();
		else {
			var subdir = '/' + env.appname + '/' + req.session.user.handle;
			var topath = process.cwd() + '/apps/static/public' + subdir;
			runInDir(topath, function(){
				var funcNum = req.param('CKEditorFuncNum');
				var url = 'http://' + env.staticurl + subdir + '/';

					finishFileLoad(req.files.upload.path, topath + '/' + req.files.upload.name, 0, function(to) {
						res.write("<script type='text/javascript'> window.parent.CKEDITOR.tools.callFunction(" + funcNum + ", '" + url + req.files.upload.name + "', '');</script>");
						res.end(); 
					});
			});
		}
	});


	env.app.get("/", function(req, res, next){
		Card.findOne({name:'darwin'}, function(err, doc) {
			rspnd(env, err, doc, req, res, next, 'showcard.htm', doc2card(doc._doc));
		});
	});


	env.app.post('/:card/edit', function(req, res, next){
		getMyCard(req, next, function(card){
			var o = req.body;
			o['modified_date'] = new Date();

			if (!card.use_email) o.use_email=false;
			if (!card.use_dmail) o.use_dmail=false;
			if (!card.contactemail) o.contactemail = req.session.user.email;

			Card.update({_id:card['_id']}, {$set:o}, function(err){
				if (err) { throw err; }
				res.send('OK');	
			});
		});
	});

	env.app.post('/upgrade', function(req, res, next){
		getMyCard(req, next, function(card){
			var o = {page:req.body.page, upgrade:true};
			o['modified_date'] = new Date();
			Card.update({_id:card['_id']}, {$set:o}, function(err){
				if (err) { throw err; }
				res.send('OK');	
			});
		});
	});

	env.app.post('/downgrade', function(req, res, next){
		getMyCard(req, next, function(card){
			var o = req.body;
			o.upgrade = false;
			o['modified_date'] = new Date();
			Card.update({_id:card['_id']}, {$set:o}, function(err){ 
				if (err) { throw err; }
				res.send('OK');	
			});
		});
	});

	env.app.get('/:card/edit', function(req, res, next){
		editCard(req, res, next);	//  undefined   =>   edit as last saved
	});
    
	env.app.get('/downgrade', function(req, res, next){
		editCard(req, res, next, false); // false   =>   edit as card
	});

	env.app.get('/upgrade', function(req, res, next){
		editCard(req, res, next, true);	// true   =>   edit as page
	});

	env.app.get('/:card', function(req, res, next){
		Card.findOne({name:req.params.card}, function(err, doc) {
			if (err || !doc) return next();
			doc = doc._doc;
			if (loggedIn(req, req.params.card) && doc && _.keys(doc).length <= 2) {
				rspnd(env, err, doc, req, res, next, 'editcard.htm', {card: ft.translateFields(doc)});
			} else {
				if (doc && doc['upgrade'])
					rspnd(env, err, doc, req, res, next, 'showpage.htm', doc2card(doc));
				else rspnd(env, err, doc, req, res, next, 'showcard.htm', doc2card(doc));
			}
		});
	});

	env.app.get('/:notfound', function(req, res, next){
		on404orCreate(req, res, next);
	});

	env.app.get('/:notfound/edit', function(req, res, next){
		on404orCreate(req, res, next);
	});


};


