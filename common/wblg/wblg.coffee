ft = require "../../justsayno.de/fieldtools"
paginate = require "../paginate/paginate"

cheerio = require "cheerio"
request = require "request"
fs = require "fs"
path = require "path"
mongoose = require "mongoose"
_ = require 'underscore'


module.exports = (env) ->

	# sniff at the file extension
	looksLikeImage = (u) ->
		lastfour = u.substr(u.length - 4).toLowerCase()
		lastfive = u.substr(u.length - 5).toLowerCase()
		lastfour is ".jpg" or lastfour is ".gif" or lastfour is ".png" or lastfive is "jpeg"


	storeImage = (image, cb) ->
		statictools = require("../../justsayno.de/statictools") env
		if not image.length then return cb null
		img_url = image
		img_name = path.basename(img_url)
		tmp_path = "/tmp/#{img_name}"
		ws = fs.createWriteStream(tmp_path)
		r = request img_url
		r.on "error", ->
			console.log "ERROR: reading: piping #{tmp_path}"
		ws.on "error", ->
			console.log "ERROR: writing: piping #{tmp_path}"
		r.on "end", ->
			today = new Date()
			staticpath = "#{env.appname}/images/#{today.getFullYear()}/#{today.getMonth()+1}"
			statictools tmp_path, staticpath, (err, newname) ->
				cb err, "#{staticpath}/#{newname}"
		r.pipe ws,
			end: false

	doStories = (req, res, docs, objs) ->
		_.each docs, (o) ->
			o.link = "/#{o.created_date.getDate()}/#{o.created_date.getMonth()+1}/#{o.created_date.getFullYear()}/#{encodeURIComponent(o.name)}"
			o.month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][o.created_date.getMonth()]
			o.day = o.created_date.getDate()

		which_fields = ["title", "comment", "month", "day", {
			link: "link.href"
			image: "image.src"
			teaser: "teaser.textpre"
		}]
		objs.eachstory = ft.translateFields(docs, which_fields)
		temps = [
			selector: "#maintab"
			filename: "showall.jade"
		]
		env.respond req, res, env.basetemps, temps, objs

	story = require("./schema/story").name
	Story = env.db.model(story)
	tag = require("./schema/tag").name
	Tag = env.db.model(tag)

	urlpre = urlpost = "/"
	if env.urlprefix
		urlpre = "/#{env.urlprefix}"
		urlpost = "/#{env.urlprefix}/"
		env.app.get "#{urlpost}", (req, res, next) ->
			res.redirect urlpre

	taginConfig =
		nakedRoute: "#{urlpost}tag/:tag"			# route for first and subsequent page
		model: Story					# the model we're paginating data from
		query:tags: "req.params.tag"	# select parameters
		fields: "name title teaser comment image created_date" # fields to extract
		sort: "-created_date"			# sort parameters
		limit: 5						# number of items per page

	paginate.setupPagLst env, taginConfig, doStories

	paginConfig =
		nakedRoute: "#{urlpre}" # special clean route for first page
		skipRoute: "#{urlpost}/roll/" # route for subsequent pages: /roll/:skip
		model: Story # the model we're paginating data from
		query: {} # select parameters
		fields: "name title teaser comment image created_date" # fields to extract
		sort: "-created_date" # sort parameters
		limit: 5 # number of items per page

	paginate.setupPagLst env, paginConfig, doStories


	tagsFromText = (textTags, cb, ids)->
		if not textTags or not textTags.length then return cb ids
		tag = textTags.shift()
		o = name:tag
		Tag.find o, (err, t)->
			if not err and t and t.name is tag and t._id
				if not ids then ids=[]
				ids.push t._id
				return tagsFromText textTags, cb, ids
			new Tag(o).save (err, t)->
				if not err and t and t.name is tag and t._id
					if not ids then ids=[]
					ids.push t._id
				return tagsFromText textTags, cb, ids


	env.app.get "/tags", (req, res, next) ->
		Tag.find {}, (err, tags) ->
			env.respond req, res, null, null, _.pluck tags, 'name'

	env.app.post "/blog", (req, res, next) ->
		protocol = "http://"
		s = comment: req.body.comment
		today = new Date()
		s.created_date = new Date(today.getFullYear(), today.getMonth(), today.getDate())
		s.modified_date = s.created_date

		unless req.body.url and req.body.url.length
			return res.send "no post", 404

		if looksLikeImage(req.body.url)
			s.image = req.body.url
		else
			s.url = req.body.url
			s.title = req.body.title
			s.image = req.body.image
			s.teaser = req.body.description
		s.name = decodeURIComponent(req.body.url)
		s.name = s.name.substr(i + 1)	while (i = s.name.indexOf("/")) >= 0
		s.name = s.name.substr(0, i)	while (i = s.name.indexOf(".")) >= 0

		# copy image locally ...
		storeImage s.image, (err, newimage) ->
			if not err and newimage
				s.image = newimage
			if s.image and s.image.length
				s.image ="#{protocol}#{env.staticurl}/#{newimage}"
			u = decodeURIComponent(req.body.url)
			u = protocol + u	unless u.substr(0, 7) is protocol
			base = u.substr(0, u.substr(7).indexOf("/") + 7)
			request u, (err, resp, bod) ->
				if not err and resp.statusCode is 200
					s.body = bod
					tagsFromText req.body.tags, (ids)->
						s.tags = ids
						new Story(s).save (err, savedsig) ->
							throw err	if err
							res.send "ok", 200
				else
					res.send "bad fetch", 404


	env.app.get "/consider/:url", (req, res, next) ->
		protocol = "http://"
		u = decodeURIComponent(req.params.url)
		u = "#{protocol}#{u}"	unless u.substr(0, 7) is protocol
		base = u.substr(0, u.substr(7).indexOf("/") + 7)
		request u, (err, resp, bod) ->
			if not err and resp.statusCode is 200
				$ = cheerio.load(bod)
				payload = title: $("title").text()
				$("meta").each ->
					switch $(this).attr("property")
						when "og:title"
							payload.title = $(this).attr("content")
						when "og:description"
							payload.description = $(this).attr("content")
						when "og:image"
							payload.image = $(this).attr("content")
				
				# rules for missing fbm
				unless payload.description # first priority para rule: strong
					$("body").find("p").each ->
						payload.description = $(this).text() if $(this).find("strong").length unless payload.description

				unless payload.description # second priority para rule: first non-empty para
					$("body").find("p").each ->
						payload.description = $(this).text() if $(this).text().length unless payload.description

				# finally : if nothing else, send elipsoids ...
				payload.description = "..." unless payload.description and payload.description.length

				unless payload.image # first priority image rule: biggest width
					w = 50
					$w = undefined
					$("body").find("img").each ->
						neww = $(this).attr("width")
						if neww
							neww = parseInt(neww, 10)
							if neww > w
								w = neww
								$w = $(this)

					payload.image = $w.attr("src")	if $w
				unless payload.image # if still no image: find first with alt txt
					$("body").find("img").each ->
						payload.image = $(this).attr("src")	if $(this).attr("alt")	unless payload.image

				payload.image = base + payload.image unless payload.image.substr(0, 7) is protocol if payload.image
				env.respond req, res, null, null, [payload]
			else
				res.send "Bad Fetch", 404


	showArt = (req, res, next) ->
		search_date = new Date(req.params.year, req.params.month - 1, req.params.date)
		next_date = new Date(search_date)
		next_date.setDate(search_date.getDate()+1)
		which_fields = ["title", "comment", "tags", {
			image: "image.src"
			url: "url.href"
			teaser: "teaser.textpre"
		} ]
		Story.findOne {
			created_date: {$gte:search_date, $lt:next_date}
			name: req.params.name
		}, ft.toStr(which_fields), (err, doc) ->
			unless err or not doc
				temps = [
					selector: "#maintab"
					filename: "showstory.jade"
				]
				pathname = "#{req.params.date} #{req.params.month} #{req.params.year} #{req.params.name}"
				env.hook["comments"] pathname, (err, c) ->
					c = 0	if err
					all_objs = story: ft.translateFields(doc, which_fields)[0]
					all_objs.commentcnt = c
					if not all_objs.story.tags or not all_objs.story.tags.length
						env.respond req, res, env.basetemps, temps, all_objs
					else Tag.find {id: $in: all_objs.story.tags}, (err, tags)->
						unless err or not tags
							_.each tags, (t) -> t.link = '/tag/' + t._id
							all_objs.story.tags = ft.translateFields tags, {name:'tags', link:'tags.href'}
							env.respond req, res, env.basetemps, temps, all_objs

	if env.urlprefix
		env.app.get "#{urlpre}/:date/:month/:year/:name", showArt
	env.app.get "/:date/:month/:year/:name", showArt
