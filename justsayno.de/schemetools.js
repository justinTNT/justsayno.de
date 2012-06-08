/* 
 * update the admin database collection to reflect the schema
 */

var	mongoose = require('mongoose');

var	fs = require('fs');
var util=require('util');
var dirt = require('./dirtools');

var	adminschema = require('./admin/schema/admin');
var Admins, AdminFields;


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
		} else {
			s_flag = false;	// only add fields not in the db
		}

		if (s_flag) {
			thisfield.listorder = thisfield.editorder = cnt;
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

		cnt++;

	});
}

function addFields(app, tab, fields, cnt, cb) {
	if (fields.length) {
		cnt++;
		nf = fields.shift();
		addAdField(app, tab, nf, cnt, function(){ addFields(app, tab, fields, cnt, cb); });
	} else if (cb) cb();
}


/*
 * iterates throught the list of schema files,
 * already derived from the schema directory
 */
function load_schema (e, dirname, filename, cb) {
var fields = []
  ,	modelname = require(dirname + '/' + filename)
  , thech = modelname;

	thech=thech.schema.tree;
	filename = filename.substr(0, filename.indexOf('.'));

	for (var key in thech) {
		var t = util.inspect(thech[key], true, 1);
		var i = t.indexOf('{ [Function: ');
		if (i>=0) {
			t = t.substr(i+13);
			t = t.substr(0,t.indexOf('\n')-1);
		} else t='String';
		fields.push({name:key, type:t});
	}

		/* now, hide fields which are in table but not schema */
	AdminFields.find({appname:e.appname, table:filename}, function(err, docs) {
		docs.forEach(function(eachd){
			var ok=false;
			for (var key=0; key<fields.length; key++) {
				if (fields[key].name == eachd.name) {
					ok=true;
					break;
				}
			}
			if (!ok) {
				eachd.listed = eachd.edited = false;
				eachd.save(function(err){
					if (err) {
	console.log('ERROR adding ' + field.name + ' in ' + tab + ' for ' + e.appname);
	console.log(err);
						throw err;
					}
				});
			}
		});
	});

	addFields(e.appname, filename, fields.slice(0), 0, cb);
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
			throw err;
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
	console.log('failed to touch : ' + dirname);
			throw err;
		}
		touch_file(dirname, files, op, fcb);
	});
}




/*
 * once we get access control / authentication / session management going,
 * we want to be sure there's an admin user setup for this app.
 */
function ensureAdminAccess(e, cb) {
	Admins.find({'appname':e.appname}, function(err, docs) {
		if (err) throw err;
		if (! docs.length) {
			var thisadm = new Admins();
			thisadm.login = thisadm.passwd = thisadm.name = 'admin';
			thisadm.appname = e.appname;

			thisadm.save(function(err){
				if (err) {
	console.log('ERROR creating default admin for ' + e.appname);
	console.log(err);
					throw err;
				} else {
					if (cb) {
						cb();
					}
				}
			});
		} else {
			if (cb) {
				cb();
			}
		}
	});
}


/*
 * make sure we have default field entries in the database for each schema in this app.
 * while testing, default behaviour is to clear all entries and rebuild.
 * TTD: we might want to take command line parameters to specify to only add fields for those schema not already there
 */
function ensureAdFieldCfg(e, appdir, commondir, fcb) {
	var i, dn = appdir + '/schema';
	touch_dir ( dn
				, function(fn, ocb){ load_schema(e, dn, fn, ocb); }
				, function(){
					if (appdir != commondir) {
						var a = require(appdir + '/' + e.appname + '_app.js');
						runThruPlugs(a.env.plugins.slice(0), e, commondir, fcb);
					} else {
						if (fcb) fcb();
					}
				} );
}

function runThruPlugs(plugin_list, e, cdir, fcb) {
	if (plugin_list.length) {
		var plug = plugin_list.shift();
		var this_cd = cdir + '/' + plug;
		ensureAdFieldCfg(e, this_cd, this_cd, function(){
							runThruPlugs(plugin_list, e, cdir, fcb);
						});
	} else if (fcb) fcb();
}

function configureDBschema(e, admdb, cb) {
	var appdir = __dirname + '/../apps/' + e.appname
	, commondir = __dirname + '/../common';

	Admins = admdb.model('justsayAdmins');
	AdminFields = admdb.model('justsayAdminFields');

	ensureAdminAccess(e, function() {
		ensureAdFieldCfg(e, appdir, commondir, cb);
	});
}

exports.configureDBschema = configureDBschema;

