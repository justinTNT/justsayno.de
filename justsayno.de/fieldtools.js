
var mongoose = require('mongoose'); // needed for forEach
var _ = require('underscore');

/*
 * findFields
 * ==========
 * helper function to extract field names from either
 * a) the schema; or
 * b) a list of simple strings, and optional objects matching fieldname keys to selector.property values
 */
function findFields(fields) {
var len;
var just_fields = [];

	if (fields) {
		len=fields.length;
		if (len) { // its a list
			for (var i=0; i<len; i++) {
				f = fields[i];
				if (_.isString(f)) // just a fieldname
					just_fields.push(f);
				else for (var key in f) // an object mapping fieldname keys to selector.property values
					just_fields.push(key);
			}
		} else { // its the schema
			for (var key in fields)
				just_fields.push(key);
		}
	}

	return just_fields;
}


function eachTxlate(eachd, fields) {
	var next_obj={};
	var len;
	if (fields) len=fields.length;	// edge case

	if (len) {
			
		for (var i=0; i<len; i++) {
			next_field = fields[i];
			if (_.isString(next_field)) {
				if (_.isString(eachd))
					next_obj[next_field] = eachd;
				else next_obj[next_field] = eachd[next_field];
			} else {
				for (var key in next_field) {
					var v = next_field[key];
					if (_.isString(eachd))	// distinct queries may just return strings
						next_obj[v] = eachd;
					else if (! _.isUndefined(eachd[key]))	// deref fieldname?
						next_obj[v] = eachd[key];
					else {
						try {
							next_obj[v] = eachd.get(key);
						} catch(e) {
							console.log('error getting ' + key);
						}
					} 			// maybe it's virtual ...
				}
			}
		}
	} else {
		for (var key in fields)
			if (! _.isUndefined(eachd[key])) {
				next_obj[key] = eachd[key];
			}
	}

	return next_obj;
}


/*
 * translateFields
 * ===============
 * helper function to extract field values. Two cases :
 * a) for each field in the schema; copy the field if it is defined
 * b) copy the field if it's a string, or rename it if its mapped in a { fieldname, 'selector[.attribute]' } tupple
 */
function translateFields(d, fields) {
var objs=[];

	if (!d) {
		console.log('no documents to translate');
	} else {
		if (! d.length) d = [d];
		d.forEach(function(eachd){
			if (!fields) {
				if (! _.isString(eachd)) {
					if (eachd._doc) eachd = eachd._doc;
					fields = _.keys(eachd);
				}
			}
			var o = eachTxlate(eachd, fields);
			objs.push(o);
		});
	}

	return objs;
}


function toStr(fields) {
	return _.reduce(fields, function(m,v) {
		if (_.isObject(v)) {
			for (key in v) {
				if (m.length) m += ' ';
				m += key;
			}
		} else {
			if (m.length) m += ' ';
			m += v;
		}
		return m;
	}, '');
}

exports.translateFields = translateFields;
exports.findFields = findFields;
exports.toStr = toStr;

