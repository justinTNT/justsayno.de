#
# * update the admin database collection to reflect the schema
#
mongoose = require("mongoose")
fs = require("fs")
util = require("util")
_ = require('underscore')

dirt = require("./dirtools")
adminschema = require("./admin/schema/admin")

Admins = undefined
AdminFields = undefined


#
# * used to build mongo URI from options
#
URIofDB = (opts, name) ->
	opts = opts or {}
	mcstr = "mongodb://"
	mcstr += "#{opts.auth.user}:#{opts.auth.pass}@"	if opts.auth
	mcstr += opts.hostname or "localhost"
	mcstr += ":#{opts.port}"	if opts.port
	mcstr += "/#{name}"
	mcstr

#
# * adds a field on this table for this app in the admin database,
# * (after making sure that it doesn't already exist!)
# * and sets default values for this field's admin configuration
#
addAdField = (app, tab, field, cnt, cb) ->

	AdminFields.find {appname:app, table:tab, name:field.name}, (err, docs) ->
		if err
			console.log "error checking in on key " + field.name + " in " + app + "'s " + tab + " table."
			throw err
		if docs.length then return cb?()
		console.log "info: adding new field: #{field.name} in #{app}'s #{tab} table."
		thisfield = new AdminFields()
		thisfield.name = field.name
		thisfield.appname = app
		thisfield.table = tab
		thisfield.listorder = thisfield.editorder = cnt
		if _.contains ["id", "_id", "modified_date", "created_date"], field.name
			thisfield.listed = thisfield.edited = false
		else
			thisfield.edited = true
			if tab is "admin" and field.type is "Boolean"
				thisfield.listed = false
			else
				thisfield.listed = true
		thisfield.listflags = field.type
		thisfield.save (err) ->
			if err
				console.log "ERROR adding " + field.name + " in " + tab + " for " + app
				console.log err
				throw err
			cb()	if cb


addFields = (app, tab, fields, cnt, cb) ->
	if not fields.length then return cb?()
	cnt++
	nf = fields.shift()
	addAdField app, tab, nf, cnt, ->
		addFields app, tab, fields, cnt, cb


#
# * iterates throught the list of schema files,
# * already derived from the schema directory
#
load_schema = (e, dirname, filename, cb) ->
	fields = []

	try
		modelname = require "#{dirname}/#{filename}"
	catch err
		console.log "error finding #{dirname}/#{filename}"
		console.dir err
		return cb()

	thech = modelname
	thech = thech.schema.paths
	filename = filename.substr(0, filename.indexOf("."))
	for key of thech
		t = util.inspect(thech[key].options.type)
		i = t.indexOf("[Function: ")
		if i >= 0
			t = t.substr(i + 11)
			t = t.substr(0, t.indexOf("]"))
		else
			t = "String"
		fields.push {name: key, type: t}

	
	# now, hide fields which are in table but not schema
	# if the scheme is changed during dev, the best thing to do is just tidy up the old fields from the table
	# note exception: table name booleans (user based table access) in the admin table

	unless filename is "admin"
		AdminFields.find {appname: e.appname, table: filename}, (err, docs) ->
			if err then return
			docs.forEach (eachd) ->
				save = true
				ok = false
				for own key, val of fields
					if val.name is eachd.name
						ok = true
						break
				unless ok
					eachd.listed = eachd.edited = false
				else
					if key < fields.length and fields[key].type isnt "String"
						if eachd.listflags is "[#{fields[key].type}]" then fields[key].type = eachd.listflags
						else if eachd.listflags isnt fields[key].type
							# TODO itd be great to deal with this correctly, but I get confused by square brackets
							console.log "Fields cfg table error (#{fields[key].name}): #{eachd.listflags} != #{fields[key].type}"
					save = false
				if save
					eachd.save (err) ->
						if err
							console.log "ERROR adding " + fields[key].name + " in " + tab + " for " + e.appname
							console.log err
							throw err
	addFields e.appname, filename, fields.slice(0), 0, cb


#
# * once we get access control / authentication / session management going,
# * we want to be sure there's an admin user setup for this app.
#
ensureAdminAccess = (e, cb) ->
	Admins.find {appname: e.appname, login:'admin'}, (err, docs) ->
		throw err	if err
		if docs?.length then return cb?()
		thisadm = new Admins()
		thisadm.login = thisadm.passwd = thisadm.name = "admin"
		thisadm.appname = e.appname
		thisadm.save (err) ->
			if err
				console.log "ERROR creating default admin for " + e.appname
				console.log err
				throw err
			cb()


#
# make sure we have default field entries in the database for each schema in this app.
# while testing, default behaviour is to clear all entries and rebuild.
# TODO: we might want to take command line parameters to specify to only add fields for those schema not already there
#
ensureAdFieldCfg = (e, appdir, commondir, fcb) ->
	dn = "#{appdir}/schema"
	dirt.touch_dir dn, ((fn, ocb) ->
		fn_a = fn.split(".")
		if fn_a.length is 2 and fn_a[1] is "js" # only eachschemafile.js
			load_schema e, dn, fn, ocb
			addAdField e.appname, "admin",
				name: fn.substr(0, fn_a[0])
				type: "Boolean"
			, 99
		else
			ocb()
	), ->
		if appdir is commondir or commondir is null then return fcb?()
		a = require "#{appdir}/#{e.appname}_app"
		runThruPlugs a.env.plugins?.slice(0), e, commondir, fcb


runThruPlugs = (plugin_list, e, cdir, fcb) ->
	if not plugin_list or not plugin_list.length then return fcb?()
	plug = plugin_list.shift()
	ensureAdFieldCfg e, "#{cdir}/#{plug}", null, ->
		runThruPlugs plugin_list, e, cdir, fcb


configureDBschema = (admdb, e, cb) ->
	appdir = "#{__dirname}/../apps/#{e.appname}"
	admindir = "#{__dirname}/admin/schema"
	commondir = "#{__dirname}/../common"
	Admins = admdb.model "justsayAdmins"
	AdminFields = admdb.model "justsayAdminFields"
	load_schema e, admindir, "admin.js", ->
		ensureAdminAccess e, ->
			ensureAdFieldCfg e, appdir, commondir, cb


module.exports =
	configureDBschema:configureDBschema
	URIofDB:URIofDB

