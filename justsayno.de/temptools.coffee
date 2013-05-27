fs = require("fs")
justsay = require("./justsay")
dirt = require("./dirtools")
ugly = require("uglify-js")
jade = require("jade")

#
# * for a list of files already derived from the named directory, iterate through the list
# * calling cb with the contents of each file that satisfies the match function,
# * then calling fcb once they're all processed
#
eachMatchedFile = (dirname, files, match, cb, fcb) ->
	if not files or not files.length then return fcb?()
	if (fn = files.shift()) and match(fn) # if its .htm or .html or .tpl ... or .jade!
		return fs.readFile "#{dirname}/#{fn}", (err, data) -> #read in the file contents
			throw err	if err
			cb String(data), fn
			eachMatchedFile dirname, files, match, cb, fcb
	eachMatchedFile dirname, files, match, cb, fcb		# continue on error / mismatch

eachPlugDir = (plugins, match, op, fcb) ->
	if not plugins or not plugins.length then return fcb?()
	if (plugin = plugins.shift())
		dirname = __dirname + "/../common/#{plugin}/browser"
		return fs.readdir dirname, (err, files) -> # get list of files in templates dir
			if err
				if err.code is 'ENOENT' then files=null		#gotta fall thru for plugins
				else throw err
			eachMatchedFile dirname, files, match, op, ->
				eachPlugDir plugins, match, op, fcb
	eachPlugDir plugins, match, op, fcb		# continue on error

#
# * for any suffix (css, js) this will :
# * 1. read the app/browser/app.suffix file
# * 2. read any files from app/browser/suffix/ that match *.suffix
# * 3. read any files from the browser directories of the app's plugins that match suffix
#
genericDynamicLoadAppFiles = (e, suffix, appendattr, fcb) ->
	re = new RegExp(".*\\.#{suffix}$")
	fs.readFile "#{e.dir}/browser/#{e.appname}.#{suffix}", (err, data)->
		if err
			console.dir err
			throw err
		data = replaceStaticApp(e, data)	if suffix is "css"
		e[appendattr] += String(data)
		fs.readdir "#{e.dir}/browser/#{suffix}/", (err, files) -> # get list of files in templates dir
			if err
				if err.code is 'ENOENT' then files=null		#gotta fall thru for plugins
				else throw err
			eachMatchedFile "#{e.dir}/browser/#{suffix}/", files, (fn)->
				re.test fn
			, (txt)->
				e[appendattr] = txt + e[appendattr]
			, ->
				if e.plugins
					eachPlugDir e.plugins.slice(0), ((fn) ->
						re.test fn
					), ((txt) ->
						e[appendattr] = txt + e[appendattr]
					), fcb
				else fcb?()


# initialise e[str] with files in dir
loadDefaults = (e, str, dir, cb) ->
	fs.readdir dir, (err, files) ->
		throw err	if err
		e[str] = ""
		dirt.eachfile dir, files, (fn, txt)->
			e[str] += replaceStaticApp e, txt
		, cb


# build css and js for app
buildScripts = (e, txt, cb) ->
	libdir = "#{__dirname}/browserlibs"
	libstr = "scriptplatestring"
	cssdir = "#{__dirname}/browserstyles"
	cssstr = "cssstring"
	loadDefaults e, libstr, libdir, ->
		dirt.read_dir "#{e.dir}/browser/libs", ((fn, str) ->
			e[libstr] += str
		), ->
			dirt.eachfile __dirname, ["justsay.js", "browserbootstrap.js"], ((fn, str) ->
				e[libstr] += str
			), ->
				e[libstr] += "var justsayno = { de: {localurl:'#{e.localurl}', staticurl:'#{e.staticurl}',\n skeleta : JSON.parse('#{txt}')}\n};\n"
				genericDynamicLoadAppFiles e, "js", libstr, ->
					if process.env.NODE_ENV
						ast = ugly.parser.parse(e[libstr]) # parse code and get the initial AST
						ast = ugly.uglify.ast_mangle(ast) # get a new AST with mangled names
						ast = ugly.uglify.ast_squeeze(ast) # get an AST with compression optimizations
						e[libstr] = ugly.uglify.gen_code(ast) # compressed code here
					loadDefaults e, cssstr, cssdir, ->
						genericDynamicLoadAppFiles e, "css", cssstr, cb


#
# reusable snippet to fill in templatable variables in fragments, css
#
replaceStaticApp = (e, txt) ->
	# and keep em in the templatipi store
	String(txt).replace(/\{\{APP\}\}/g, e.appname).replace(/\{\{STATIC\}\}/g, "http://#{e.staticurl}/").replace /\{\{LOCAL\}\}/g, "http://#{e.localurl}/"

#
# populatipi -	populate the app env's templatipi template array
#				from the contents of all /.*\.html?/ files in the specified directory
# ----------
# e: the environment object for the app we're currently populating
# dirname : the directory to load all templates from
#
populatipi = (e, dirname, whichplate, done) ->
	fs.readdir dirname, (err, files) -> # get list of files in templates dir
		throw err	if err
		# if its .htm or .html or .tpl OR .jade
		eachMatchedFile dirname, files, (fn) ->
			/.*\.html?$/.test(fn) or /.*\.jade$/.test(fn) or /.*\.tpl$/.test(fn)
		, (txt, fn) -> # pull off each dir entry
			if /.*\.jade$/.test(fn)
				e[whichplate][fn] = jade.compile(txt)(
					APP: e.appname
					STATIC: "http://#{e.staticurl}/"
					LOCAL: "http://#{e.localurl}/"
				).replace(/\"/g, "'")
			else
				e[whichplate][fn] = replaceStaticApp(e, txt)
		, done


#
# * configureTemplates - load templates and hook into the weld
#
configureTemplates = (e, cb) ->
	bpfn = "boilerplate.tpl"
	e.templatipi = {} # start with an empty templatipi object
	e.skeletipi = {}
	fs.readFile __dirname + "/" + bpfn, (err, data) -> #read in the file contents
		throw err	if err
		fs.readFile e.dir + "/templates/fragments/headfrag.htm", (err, d2)-> # add header frag
			d2 = ""	if err
			s = replaceStaticApp(e, data)
			i = s.indexOf("<meta")
			s = s.substr(0, i) + String(d2) + s.substr(i)
			e.templatipi[bpfn] = s
			# load all base- templates into memory
			populatipi e, "#{e.dir}/templates/baseplates", "templatipi", -> # load all skeleta into memory
				populatipi e, "#{e.dir}/templates/skeleta", "skeletipi", ->
					for i of e.skeletipi
						txt = (e.templatipi[i] = e.skeletipi[i])
						txt = txt.replace(/[\t\n\r]/g, " ")
						e.skeletipi[i] = txt.replace(/'/g, "\\'")
					buildScripts e, JSON.stringify(e.skeletipi).replace(/\\\\\'/g, "\\'"), cb

	e.respond = -> # respond calls the basic welder with this env.
		args = [@templatipi]
		i = 0
		while i < arguments.length
			args.push arguments[i++]
		if e.customplate
			if i is 3
				args.push null
				args.push null
			args.push e.customplate
		justsay.respond.apply this, args

module.exports = configureTemplates:configureTemplates

