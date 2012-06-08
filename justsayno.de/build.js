/* 
 * this ugly script compiles the plugins.js file for the specified app. 
 * We do this programmatically (rather than just cat-ing the libs) because we also
 * create a JSON string from all the skeletal templates (non-base plates)
 * to these, we also add the browser bootstrap, the core libraries (jq + sammy)
 * and the common code from justsay.js
 *
 * this ugly script creates a plugins.js file in the browser directory of the app.
 * For production, cat plugins and script, then minify to create a single compiled .js
 */

var	mongoose = require('mongoose');

var admdb = mongoose.createConnection('mongodb://localhost/justsayadmin');
var	adminschema = require('./admin/schema/admin');
var	Admins = admdb.model('justsayAdmins');
var	AdminFields = admdb.model('justsayAdminFields');

var	fs = require('fs');
var	ofd;

var	appname, appdir, commondir;
var rejig_db;


var util=require('util');

function writeStr2File(str) {
	fs.writeSync(ofd, str, null);
}


/*
 * clears admin config for this table / for this app
 */
function wipeAdFields(app, tab, cb) {
	if (rejig_db != 'all') cb(); // only wipe if we're building all
	else AdminFields.remove({'appname':app, 'table':tab}, function(err, docs) {
		if (err) {
			console.log('error wiping ' + app + '\'s ' + tab + 'table.');
			throw err;
		}
		cb();
	});
}


/*
 * adds a field on this table for this app in the admin database,
 * (after making sure that it doesn't already exist!)
 * and sets default values for this field's admin configuration
 */
function addAdField(app, tab, field, cnt, cb) {
	AdminFields.find({appname:app, table:tab, name:field.name}, function(err, docs) {
		var s_flag = true;
		var thisfield = {};
		if (err) {
			console.log('error checking in on key ' + field.name + ' in ' + app + '\'s ' + tab + ' table.');
			throw err;
		}
		if (! docs.length) {
			thisfield = new AdminFields();
			thisfield.name = field.name;
			thisfield.appname = app;
			thisfield.table = tab;
		} else if (rejig_db == 'all' || rejig_db == 'refresh') {
			thisfield = docs[0];
		} else s_flag=false;
		thisfield.listorder = thisfield.editorder = cnt++;

		if (s_flag) {
			if (field.name == 'id' || field.name == '_id' || field.name == 'modified_date' || field.name == 'created_date') {
				thisfield.listed = false;
				thisfield.edited = false;
			} else if (! docs.length) {
				thisfield.listed = true;
				thisfield.edited = true;
			}
			thisfield.listflags = field.type;

			thisfield.save(function(err){
				if (err) {
	console.log('ERROR adding ' + field.name + ' in ' + tab + ' for ' + app);
	console.log(err);
					throw err;
				}
				cb();
			});
		} else cb();

	});
}

function addFields(app, tab, fields, cnt, cb) {
	if (fields.length && rejig_db && rejig_db != 'none') {
		cnt++;
		nf = fields.shift();
		addAdField(app, tab, nf, cnt, function(){ addFields(app, tab, fields, cnt, cb); });
	} else if (cb) cb();
}


/*
 * iterates throught the list of schema files,
 * already derived from the schema directory
 */
function load_schema (dirname, filename, cb) {
var fields = []
  ,	modelname = require(dirname + '/' + filename)
  , thech = modelname;

	thech=thech.schema.tree;
	filename = filename.substr(0, filename.indexOf('.'));

	for (key in thech) {
		var t = util.inspect(thech[key], true, 1);
		var i = t.indexOf('{ [Function: ');
		if (i>=0) {
			t = t.substr(i+13);
			t = t.substr(0,t.indexOf('\n')-1);
		} else t='String';
		fields.push({name:key, type:t});
	}

	// falls thru, unless rejig is set to all
	wipeAdFields(appname, filename, function() {
		addFields(appname, filename, fields, 0, cb);
	});
}


/*
 * reads contents of named file from specified directory,
 * and returns the contents (as a string) to the callback
 */
function read_file(dname, fname, cback) {
	fs.readFile(dname + '/' + fname, function (err, data) {	// read in the file contents
		if (err) {
			console.log(err);	// debug
			console.log(dname + '/' + fname);	// debug
		} else cback(fname, String(data));
	});
}

/*
 * for a list of files already derived from the named directory,
 * iterate through the list, calling cb with the contents of each file,
 * then calling fcb once they're all processed
 */
function eachfile(dirname, files, cb, fcb) {
	fn = files.shift();
	if (fn) {
		read_file(dirname, fn, function(cbfname, text) {
			cb(cbfname, text);
			eachfile(dirname, files, cb, fcb);
		});
	} else if (fcb) fcb();
}

/*
 * similar : for a list of files already derived from the named directory,
 * iterate through the list, calling cb with the name of each file,
 * then calling fcb once they're all processed
 */
function touch_file(dirname, files, op, fcb) {
	fn = files.shift();
	if (fn) {
		op(fn, function() {
			touch_file(dirname, files, op, fcb);
		});
	} else if (fcb) fcb();
}

/*
 * get the list of files found in the named directory,
 * and pass on for processing.
 * cb is passed the contents of each file,
 * fcb is called when we're all done
 */
function read_dir (dirname, cb, fcb) {
	fs.readdir(dirname, function(err, files){
		if (err) {
			console.log('failed to read : ' + dirname);
			throw err;
		}
		eachfile(dirname, files, cb, fcb);
	});
}

/*
 * similar : get the list of files found in the named directory,
 * and pass on for processing.
 * op is passed the name of each file, and a continuation callback
 * fcb is called when we're all done
 */
function touch_dir (dirname, op, fcb) {
	fs.readdir(dirname, function(err, files){
		if (err) {
			console.log('failed to read : ' + dirname);
			throw err;
		}
		touch_file(dirname, files, op, fcb);
	});
}




/*
 * once we get access control / authentication / session management going,
 * we want to be sure there's an admin user setup for this app.
 */
function ensureAdminAccess(cb) {
	Admins.find({'appname':appname}, function(err, docs) {
		if (err) throw err;
		if (! docs.length) {
			var thisadm = new Admins();
			thisadm.login = thisadm.passwd = thisadm.name = 'admin';
			thisadm.appname = appname;

			thisadm.save(function(err){
				if (err) {
	console.log('ERROR creating default admin for ' + appname);
	console.log(err);
					throw err;
				} else {
					if (cb) cb();
				}
			});
		} else cb();
	});
}


/*
 * make sure we have default field entries in the database for each schema in this app.
 * while testing, default behaviour is to clear all entries and rebuild.
 * TTD: we might want to take command line parameters to specify to only add fields for those schema not already there
 */
function ensureAdFieldCfg(dname, cb) {
	var i, dn = dname + '/schema';
	touch_dir ( dn
				, function(fn, cb){ load_schema(dn, fn, cb); }
				, function(){
					if (dname == appdir) {
						e = require(appdir + '/' + appname + '_app.js');
						if (e.env.plugins.length) {
							for (i in e.env.plugins) {
								ensureAdFieldCfg(commondir + '/' + e.env.plugins[i]
												, function(){
													if (i == e.env.plugins.length-1)
														cb();
												});
							}
						} else {
							cb();
						}
					} else {
						cb();
					}
				} );
}


appname=process.argv[2];
if (!appname) {
	console.log('usage: node build.js <appname> [all|missing|refresh|none]');
	console.log('where <appname> is the name of the application to rebuild browser plugins and template skeleta for,');
	console.log('and the optional second argument chooses whether to replace, update or ignore existing field definitions.');
	return;
}

rejig_db = process.argv[3];


/*
 * set the working directory for this app
 * note this same build is also used to give us the admin -
 * but don't rebuild admin unless you're sure of what you're doing!
 *
 * Note:
 * it's tempting, but too dangerous, to allow for appname /ALL/.
 * I'd rather have a separate shell script call build multiple times
 * than risk losing admin cfg and browser script compression
 * that might have been done since the last build (for production)
 */

appdir = __dirname;
commondir = __dirname + '/../common';
if (appname == 'admin')
	appdir += '/admin';
else appdir += '/../apps/' + appname;

ofd = fs.openSync(appdir + '/browser/plugins.js', 'w');


/*
 * this call builds the javascript file for the browser
 */

		var libd = __dirname+'/browserlibs';
		var jqd = __dirname+'/jquery';
		fs.readdir(jqd, function(err, files){
			if (err) {
				throw err;
			}
			eachfile(jqd, files
					, function(fn, str) { writeStr2File(str); }
					, function(){

				fs.readdir(libd, function(err, files) {
					if (err) {
						throw err;
					}
					eachfile(libd, files
							, function(fn, str){ writeStr2File(str); }
							, function(){
								read_dir(appdir + '/browser/libs',
									function(fn, str){
										writeStr2File(str);
									},
									function(){
										eachfile(__dirname, ["justsay.js", "browserbootstrap.js", ],
											function(fn, str){
												writeStr2File(str);
											}, function(){
												fs.close(ofd);
											});
									});
					});
				});

			});
		});

/*
 * this section makes sure we have a super admin user in the database for this app
 * then (on callback) sets up the default admin layout for all the fields,
 */

	if (appname == 'admin') {
		ensureAdFieldCfg(appdir, function(){
				setTimeout(function(){admdb.close();},123);
		});
	} else {
		ensureAdminAccess(function() {
			ensureAdFieldCfg(appdir, function(){
				setTimeout(function(){admdb.close();},123);
			})
		});
	}
