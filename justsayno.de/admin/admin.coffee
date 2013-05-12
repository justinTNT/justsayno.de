
module.exports = (e, admdb) ->
	env =
		app: require("express")()
		dir: __dirname
		appname: "admin"
		targetapp: e.appname
		targetenv: e
		staticurl: e.staticurl
		localurl: e.localurl
		basetemps: [
			selector: "#boilerplate-container"
			filename: "admin.jade"
		]
	return {
		env: env
		setRoutes: ->
			require("./admin_routes") env, e, admdb
	}
