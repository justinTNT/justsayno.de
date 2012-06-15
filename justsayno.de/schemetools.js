/* 
 * update the admin database collection to reflect the schema
 */

require('mongoose');
require('./admin/schema/admin');
var Admins, AdminFields;

var util=require('util');
var dirt = require('./dirtools');



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
		var nf = fields.shift();
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

	thech=thech.schema.paths;
	filename = filename.substr(0, filename.indexOf('.'));

	for (var key in thech) {
		var t = util.inspect(thech[key].options.type);
		var i = t.indexOf('[Function: ');
		if (i>=0) {
			t = t.substr(i+11);
			t = t.substr(0,t.indexOf(']'));
		} else t='String';
		fields.push({name:key, type:t});
	}

		/* now, hide fields which are in table but not schema */
	AdminFields.find({appname:e.appname, table:filename}, function(err, docs) {
		docs.forEach(function(eachd){
            
			var key, save=true, ok=false;
			for (key=0; key<fields.length; key++) {
				if (fields[key].name == eachd.name) {
					ok=true;
					break;
				}
			}

            if (!ok) {
				eachd.listed = eachd.edited = false;
			} else if (fields[key].type != 'String') {	// make sure non-strings have their true type updated
				eachd.listflags = fields[key].type;
			} else save = false;

            if (save) {
				eachd.save(function(err){
					if (err) {
	console.log('ERROR adding ' + eachd.name + ' in ' + filename + ' for ' + e.appname);
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
	var dn = appdir + '/schema';
	dirt.touch_dir ( dn
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

