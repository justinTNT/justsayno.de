_ = require("underscore")			# needed for forEach
mongoose = require("mongoose")

###
# findFields
# ==========
# helper function to extract field names from either
# a) the schema; or
# b) a list of simple strings, and optional objects matching fieldname keys to selector.property values
###
findFields = (fields) ->
	len = undefined
	just_fields = []
	if fields
		len = fields.length
		if len # its a list
			i = 0
			while i < len
				f = fields[i]
				if _.isString(f) then just_fields.push f	# just a fieldname
				else # an object mapping fieldname keys to selector.property values
					for key of f
						just_fields.push key
				i++
		else # its the schema
			for key of fields
				just_fields.push key
	just_fields


# jTNT abstracted out this common component
objTxlate = (doc, fields) ->
	obj = {}
	for own key, val of fields
		if _.isString(doc) # distinct queries may just return strings
			obj[val] = doc
		else if _.isUndefined(doc[key]) # deref fieldname?
			try
				obj[val] = doc.get(key)
			catch e
				console.log "error getting " + key
		else obj[val] = doc[key]
	# maybe it's virtual ...
	obj


eachTxlate = (eachd, fields) ->
	next_obj = {}
	len = undefined
	len = fields.length	if fields # edge case
	return objTxlate(eachd, fields)	unless len # simple case of just an object in fields
	i = 0
	while i < len
		next_field = fields[i]
		if _.isString(next_field)
			if _.isString(eachd)
				next_obj[next_field] = eachd
			else
				next_obj[next_field] = eachd[next_field]
		else
			_.extend next_obj, objTxlate(eachd, next_field)
		i++
	next_obj

###
# translateFields
# ===============
# helper function to extract field values. Two cases :
# a) for each field in the schema; copy the field if it is defined
# b) copy the field if it's a string, or rename it if its mapped in a { fieldname, 'selector[.attribute]' } tupple
###
translateFields = (d, fields) ->
	objs = []
	unless d
		console.log "no documents to translate"
	else
		d = [d]	unless d.length
		d.forEach (eachd) ->
			unless fields
				unless _.isString(eachd)
					#eachd = eachd._doc	if eachd._doc
					fields = _.keys(eachd)
			objs.push eachTxlate(eachd, fields)
	objs


toStr = (fields) ->
	_.reduce fields, ((m, v) ->
		if _.isObject(v)
			for key of v
				m += " "	if m.length
				m += key
		else
			m += " "	if m.length
			m += v
		m
	), ""

exports.translateFields = translateFields
exports.findFields = findFields
exports.toStr = toStr
