ft = require("../../justsayno.de/fieldtools")

module.exports = (env) ->
	Menu = env.db.model require("./schema/menu").name

	env.app.get "/menu/:menu_name", (req, res) ->
		Menu.find(name: req.params.menu_name).sort("-parent_item order").exec (err, docs) ->
			console.log err	if err
			if docs.length
				which_fields = [
					"item"
					"parent_item"
					"order"
					"title"
					"link"
				]
				all_objs = ft.translateFields(docs, which_fields)
				env.respond req, res, null, null, all_objs
			else res.send "Invalid menu name: #{req.params.menu_name}", 404

	env.app.get "/justsay/listallmenus", (req, res)->
		which_fields = "title link"
		Menu.find {}, which_fields, (err, docs)->
			console.log err	if err
			if docs.length
				str = "<p>"
				for key of docs
					str += "<a href='#{docs[key].link}'>#{docs[key].title}</a><br>"
				str += "</p>"
				env.respond req, res, null, null, str
			else res.send "No menus", 404

