mongoose = require("mongoose")
_ = require("underscore")
_.mixin capitalize: (string)-> string.charAt(0).toUpperCasse() + string.substring(1).toLowerCase()

fs = require("fs")
sys = require("util")

require "./schema/admin"
require "./schema/taxon"

ft = require("../fieldtools")
temptools = require("../temptools")
schemetools = require("../schemetools")

module.exports = (env, appenv, admdb) ->
	
	admins = admdb.model("justsayAdmins")
	Fields = admdb.model("justsayAdminFields")
	Taxon = admdb.model("taxon")


	# this convoluted conclusion to the very simple file load
	# is cos we might want to rename it if it already exists ...

	finishFileLoad = (from, to, count, cb) ->
		fs.stat to, (err, stats) ->
			i = undefined
			unless err
				if count
					to = to.substr(0, to.length - 1)	until to.charAt(to.length - 1) is "_"
					to = to.substr(0, to.length - 1)
				to = "#{to}_#{count.toString()}"
				count++
				finishFileLoad from, to, count, cb
			else
				fs.rename from, to
				to = to.substr(i + 1)	while (i = to.indexOf("/")) >= 0
				cb to


	STRstatdirlist = (path, files, stats, cb) ->
		if not files?.length then return cb stats
		fn = files.shift()
		fs.stat path + fn, (err, s) ->
			unless err
				mt = JSON.stringify(s.mtime)
				stats.push
					filelist_name: fn
					filelist_date: mt
					filelist_size: s.size
			STRstatdirlist path, files, stats, cb


	statdirlist = (path, files, stats, cb) ->
		if not files?.length then return cb stats
		fn = files.shift()
		fs.stat path + fn, (err, s) ->
			if not err and s.isFile()
				stats.push
					filelist_name: fn
					filelist_date: s.mtime
					filelist_size: s.size
			statdirlist path, files, stats, cb

	
	authenticate = (name, pass, appname, cb) ->
		admins.find
			appname: appname
			login: name
		, (err, docs) ->
			throw err	if err
			if not docs?.length or docs[0].passwd isnt pass then return cb()
			o = docs[0].toObject()
			delete o.passwd
			cb(o)


	requiresLogin = (req, res, next) ->
		if not req.session or req.session.user then return next()
		res.redirect "/sessions/new"


	###
	# ROUTE MIDDLEWARE
	###

	#	 this route middleware makes sure the admin functionality on the admin table is only available to the admin user
	#	 NOTE it also works out which schema we're working on

	onlyAdminCanAdminAdmin = (req, res, next) ->
		if req.params.table is "admin"
			req.params.theTable = admins
			if req.session.user.login is "admin" then next()
			else next new Error "Unauthorised access of admin tables"
		else
			sch = null
			try
				sch = require "../../apps/#{env.targetapp}/schema/#{req.params.table}"
			catch err
				for i of appenv.plugins
					unless sch
						try
							sch = require "../../common/#{appenv.plugins[i]}/schema/#{req.params.table}"
			if sch then req.params.theTable = env.targetenv.db.model(sch.name)
			else req.params.theTable = env.targetenv.db.model _.capitalize req.params.table
			next()
	

	#	 this route middleware makes sure the admin functionality on the vocabs table is only available to the admin user

	onlyAdmVox = (req, res, next) ->
		if req.session.user.login is "admin" then return next()
		next new Error("Unauthorised access of vocab tables")


	###
	# ckeditor paths
	###

	env.app.get "/ck_browse", requiresLogin, (req, res) ->
		topath = process.cwd() + "/apps/static/public/#{env.targetapp}/admcke/"
		fs.readdir topath, (err, files) ->
			temps = [
				selector: "#maintab"
				filename: "filebrowse.jade"
			]
			browsebase = [
				selector: "#boilerplate-container"
				filename: "browse.jade"
			]
			url = "http://#{env.staticurl}/#{env.targetapp}/admcke/"
			STRstatdirlist topath, files, [], (stats) ->
				env.respond req, res, browsebase, temps,
					hidden_url: url
					file_list_file: stats
				, "browse.tpl"


	env.app.post "/ck_upload", requiresLogin, (req, res) ->
		topath = process.cwd() + "/apps/static/public/#{env.targetapp}/admcke/"
		funcNum = req.param("CKEditorFuncNum")
		url = "http://#{env.staticurl}/#{env.targetapp}/admcke/"
		finishFileLoad req.files.upload.path, topath + req.files.upload.name, 0, (to) ->
			res.set 'X-Frame-Options','SAMEORIGIN'
			res.send "<script type='text/javascript'> window.parent.CKEDITOR.tools.callFunction(#{funcNum}, '#{url}#{req.files.upload.name}', '');</script>"


	# list tables

	env.app.get "/list", requiresLogin, (req, res, next) ->
		Fields.distinct "table",
			appname: env.targetapp
		, (err, docs) ->
			throw err	if err
			unless req.session.user.login is "admin" # if not super admin, ...
				j = 0
				while j < docs.length
					if docs[j] is "admin" then delete docs[j]					# ... don't include admin table, ...
					else delete (docs[j])	unless req.session.user[docs[j]]	# ... filter by per user privs, ...
					j++
			which_fields = ["table", table: 'table.href']
			all_objs = tabitem: ft.translateFields(_.compact(docs), which_fields)
			temps = [
				selector: "#maintab"
				filename: "listall.jade"
			,
				selector: "#theschemes"
				filename: "eachtab.jade"
			]
			if req.session.user.login is "admin"
				temps.push
					selector: "#vocablink"
					filename: "vocablink.jade"

			env.respond req, res, env.basetemps, temps, all_objs

	
	# 	 list, add and delete vocabs and taxa

	env.app.get "/vocabs", requiresLogin, onlyAdmVox, (req, res, next) ->
		Taxon.distinct "vocab", {appname: env.targetapp}, (err, docs) ->
			throw err	if err
			which_fields = ["vocab"]
			all_objs = ft.translateFields(docs, which_fields)
			env.respond req, res, null, null, all_objs


	env.app.get "/vocab/:vocab", requiresLogin, onlyAdmVox, (req, res, next) ->
		Taxon.find
			appname: env.targetapp
			vocab: req.params.vocab
		, (err, docs) ->
			throw err	if err
			which_fields = ["taxon"]
			all_objs = ft.translateFields(docs, which_fields)
			env.respond req, res, null, null, all_objs


	env.app.get "/vox_n_tax", requiresLogin, (req, res, next) ->
		Taxon.find(appname: env.targetapp).sort("vocab").exec (err, docs) ->
			throw err	if err
			which_fields = ["vocab", "taxon"]
			snd_obj = {}
			all_objs = ft.translateFields(docs, which_fields)
			for i of all_objs
				v = all_objs[i].vocab
				snd_obj[v] = []	unless snd_obj[v]
				if all_objs[i].taxon and all_objs[i].taxon.length
					snd_obj[v].push all_objs[i].taxon
			env.respond req, res, null, null, snd_obj


	env.app.post "/remove_voc", requiresLogin, onlyAdmVox, (req, res, next) ->
		vox = JSON.parse(req.body.id_array)
		Taxon.remove {vocab:$in:vox}, (err, docs) ->
			throw err	if err
		res.send "OK"


	env.app.post "/remove_voc/:vocab", requiresLogin, onlyAdmVox, (req, res, next) ->
		tax = JSON.parse(req.body.id_array)
		Taxon.remove {vocab:req.params.vocab, taxon:$in:tax}, (err, docs) ->
			throw err	if err
		res.send "OK"


	env.app.post "/add_voc/:vocab", requiresLogin, onlyAdmVox, (req, res, next) ->
		o =
			appname: env.targetapp
			vocab: req.params.vocab
			taxon: ""		# we need this empty string record just to instantiate the vocab on this app
		new Taxon(o).save (err) ->
			# TODO if it is a validation error, send something sensible back to the client...
			throw err	if err
			res.send "OK"


	env.app.post "/add_voc/:vocab/:taxon", requiresLogin, onlyAdmVox, (req, res, next) ->
		o = appname:env.targetapp, vocab:req.params.vocab, taxon: req.params.taxon
		new Taxon(o).save (err) ->
			# TODO if it is a validation error, send something sensible back to the client...
			throw err	if err
			res.send "OK"


	env.app.get "/:table/list/:skip", requiresLogin, onlyAdminCanAdminAdmin, (req, res, next) ->
		o = {}
		o = appname: env.targetapp	if req.params.table is "admin"
		req.params.theTable.find(o).limit(20).skip(req.params.skip).exec (err, docs) ->
			throw err	if err
			for i of docs
				for own key, val of docs[i]._doc
					if val and val.getMinutes
						docs[i][key].setMinutes val.getMinutes()-val.getTimezoneOffset()
			env.respond req, res, null, null, docs


	env.app.get "/:table/list/:skip/:field", requiresLogin, onlyAdminCanAdminAdmin, (req, res, next) ->
		req.params.theTable.find({}).limit(20).skip(req.params.skip).sort(req.params.field).exec (err, docs) ->
			throw err	if err
			env.respond req, res, null, null, docs


	env.app.post "/add_to/:table", requiresLogin, onlyAdminCanAdminAdmin, (req, res, next) ->
		Fields.find(
			appname: env.targetapp
			table: req.params.table
		).exec (err, docs) ->
			throw err	if err
			o = JSON.parse(req.body.obj)
			o.appname = env.targetapp	if req.params.table is "admin"
			for own key, val of docs
				if val.name is "modified_date" or val.name is "created_date"
					o[val.name] = new Date()
			new req.params.theTable(o).save (err) ->
				# TODO if it is a validation error, send something sensible back to the client...
				throw err	if err
				res.send "OK"



	env.app.post "/update/:table", requiresLogin, onlyAdminCanAdminAdmin, (req, res, next) ->
		Fields.find(
			appname: env.targetapp
			table: req.params.table
		).exec (err, docs) ->
			throw err	if err
			o = JSON.parse(req.body.obj)
			for key of docs
				o[docs[key].name] = new Date()	if docs[key].name is "modified_date"
			req.params.theTable.update {_id:req.body.id}, {$set:o}, (err) ->
				# TODO if it is a validation error, send something sensible back to the client...
				throw err	if err
				res.send "OK"


	env.app.post "/remove_from/:table", requiresLogin, onlyAdminCanAdminAdmin, (req, res, next) ->
		ids = JSON.parse(req.body.id_array)
		req.params.theTable.remove
			_id:
				$in: ids
		, (err, docs) ->
			throw err	if err
		res.send "OK"


	env.app.post "/update_config/:table", requiresLogin, (req, res) ->
		if req.session.user.login isnt "admin"
			console.log "authorisation error for user :"
			console.log req.session.user
			return
		thislist = JSON.parse(req.body.list)
		_.each thislist, (item) ->
			id = item._id
			delete item._id

			Fields.update
				_id: id
			, item, (err, docs) ->
				throw err	if err
		res.send "OK"


	env.app.post "/refresh", requiresLogin, (req, res) ->
		if req.session.user.login isnt "admin"
			console.log "authorisation error for user :"
			console.log req.session.user
			return
		temptools.configureTemplates env.targetenv, ->
			schemetools.configureDBschema admdb, env.targetenv, ->
				res.send "OK"


	###
	# session paths
	###

	env.app.get "/sessions/new", (req, res) ->
		temps = [
			selector: "#maintab"
			filename: "login.htm"
		]
		env.respond req, res, env.basetemps, temps, null


	env.app.post "/sessions", (req, res) ->
		authenticate req.body.login, req.body.password, env.targetapp, (user) ->
			if not user then return res.redirect "/sessions/new"
			req.session.user = {}
			for own key, val of user
				req.session.user[key] = val
			res.redirect "/list"


	env.app.post "/session/end", (req, res) ->
		if req.session and req.session.destroy
			req.session.destroy ->
		req.session = null
		res.redirect "/sessions/new"


	###
	# upload paths
	###

	env.app.get "/browse/:where", requiresLogin, (req, res) ->
		topath = "#{process.cwd()}/apps/static/public/#{env.targetapp}/#{req.param("subdir")}/"
		fs.readdir topath, (err, files) ->
			if not files then return env.respond req, res, null, null, null
			statdirlist topath, files, [], (stats) ->
				env.respond req, res, null, null, stats


	env.app.post "/upload/:where", requiresLogin, (req, res) ->
		topath = "#{process.cwd()}/apps/static/public/#{env.targetapp}/#{req.param("subdir")}/"
		frompath = "/tmp/#{req.params.where}_"
		filename = req.headers["x-file-name"]
		filestream = new fs.WriteStream(frompath + filename)
		req.addListener "data", (buff) ->
			filestream.write buff
		req.addListener "end", ->
			filestream.end()
			finishFileLoad frompath + filename, topath + filename, 0, (to) ->
				res.writeHead 200,
					"content-type": "text/plain"
					"final-filename": to
				res.end()


	env.app.get "/keys/:table", onlyAdminCanAdminAdmin, (req, res, next) ->
		Fields.findOne(
			appname: env.targetapp
			table: req.params.table
			listed: true
		).sort("listorder").exec (err, doc) ->
			if not doc?.name then return env.respond req, res, null, null, null
			req.params.theTable.find({}, doc.name).exec (err, docs) ->
				throw err	if err
				idkeys = []
				_.each docs, (d) ->
					idkeys.push
						name: d[doc.name]
						id: d._id
				env.respond req, res, null, null, idkeys


	env.app.get "/", (req, res, next) ->
		temps = [
			selector: "#maintab"
			filename: "login.htm"
		]
		env.respond req, res, env.basetemps, temps, null

	

	#	 note: this comes last to ensure it doesn't hijack single-word routes
	#	 - no requireslogin, cos we might get hitup for favicon etc

	env.app.get "/:table", (req, res, next) ->
		if req.params.table.indexOf(".") > 0 then return # not really a table name, prolly favicon.ico ...
		Fields.find(
			appname: env.targetapp
			table: req.params.table
		).sort("listorder").exec (err, docs) ->
			throw err	if err
			_.each docs, (d) ->
				delete d.appname
				delete d.table
			env.respond req, res, null, null, docs


