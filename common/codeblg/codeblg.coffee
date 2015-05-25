ft = require "../../justsayno.de/fieldtools"
paginate = require "../paginate/paginate"

cheerio = require "cheerio"
request = require "request"
fs = require "fs"
path = require "path"
mongoose = require "mongoose"
_ = require 'underscore'


module.exports = (env) ->

	doStories = (req, res, docs, objs) ->
		temps = [
			selector: "#maintab"
			filename: "showall.jade"
		]
		if not docs then return env.respond req, res, env.basetemps, temps, null
		_.each docs, (o) ->
			o.link = "/#{o.created_date.getDate()}/#{o.created_date.getMonth()+1}/#{o.created_date.getFullYear()}/#{encodeURIComponent(o.name)}"
			o.month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][o.created_date.getMonth()]
			o.day = o.created_date.getDate()

		which_fields = ["title", "comment", "month", "day", teaser: "teaser.textpre"]
		objs.eachstory = ft.translateFields(docs, which_fields)
		env.respond req, res, env.basetemps, temps, objs

	codestory = require("./schema/codestory").name
	Codestory = env.db.model(codestory)
	tag = require("./schema/tag").name
	Tag = env.db.model(tag)

	urlpre = urlpost = "/"
	if env.urlprefix
		urlpre = "/#{env.urlprefix}"
		urlpost = "/#{env.urlprefix}/"
		env.app.get "#{urlpost}", (req, res, next) ->
			res.redirect urlpre

	taginConfig =
		nakedRoute: "#{urlpost}tag/:tag"					# route for first and subsequent page
		model: Codestory									# the model we're paginating data from
		query:tags: "req.params.tag"						# select parameters
		fields: "name title teaser comment created_date"	# fields to extract
		sort: "-created_date"								# sort parameters
		limit: 5											# number of items per page

	paginate.setupPagLst env, taginConfig, doStories

	paginConfig =
		nakedRoute: "#{urlpre}" # special clean route for first page
		skipRoute: "#{urlpost}roll/" # route for subsequent pages: /roll/:skip
		model: Codestory # the model we're paginating data from
		query: {} # select parameters
		fields: "name title teaser comment image created_date" # fields to extract
		sort: "-created_date" # sort parameters
		limit: 5 # number of items per page

	paginate.setupPagLst env, paginConfig, doStories


	tagsFromText = (textTags, cb, ids)->
		if not textTags or not textTags.length then return cb ids
		tag = textTags.shift()
		o = name:tag
		Tag.findOne o, (err, t)->
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
			env.respond req, res, null, null, _.uniq _.pluck tags, 'name'

	env.app.post "/blog", (req, res, next) ->
		protocol = "http://"
		s = comment: req.body.comment
		today = new Date()
		s.created_date = new Date(today.getFullYear(), today.getMonth(), today.getDate())
		s.modified_date = s.created_date

		s.title = req.body.title
		s.teaser = req.body.description
		s.name = req.body.name

		tagsFromText req.body.tags, (ids)->
			s.tags = ids
			new Codestory(s).save (err, savedsig) ->
				throw err	if err
				res.status(200).send "ok"



	showArt = (req, res, next) ->
		search_date = new Date(req.params.year, req.params.month - 1, req.params.date)
		next_date = new Date(search_date)
		next_date.setDate(search_date.getDate()+1)
		which_fields = ["title", "comment", "tags", teaser: "teaser.textpre" ]
		console.dir {
			name: req.params.name
			created_date: {$gte:search_date, $lt:next_date}
		}
		Codestory.findOne {
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
					else Tag.find {_id: $in: all_objs.story.tags}, (err, tags)->
						unless err or not tags
							_.each tags, (t) -> t.link = '/tag/' + t._id
							all_objs.story.tags = ft.translateFields tags, {name:'tags', link:'tags.href'}
							env.respond req, res, env.basetemps, temps, all_objs

	artRout = "/:date/:month/:year/:name"
	if env.urlprefix then artRout = env.urlprefix + artRout
	env.app.get artRout, showArt
