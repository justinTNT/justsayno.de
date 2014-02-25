
#
#	this does the pagination logic,
#	and primes the return object to include the nextlink where appropriate
#
showPaginatedList = (env, req, res, next, cfg, skip, cb, skipRoute) ->
	newq = {}
	for i of cfg.query
		if cfg.query[i].substr(0, 11) is "req.params."
			newq[i] = req.params[cfg.query[i].substr(11)]
		else
			newq[i] = cfg.query[i]
	cfg.model.find(newq, cfg.fields).sort(cfg.sort).limit(cfg.limit).skip(skip).exec (err, docs)->
		if err then console.log "DEBUG : PAGINATE ERROR : " + err
		if err or not docs or not docs.length then return cb req, res
		objs = {}
		href = skipRoute + (cfg.limit + skip)
		for p of req.params
			if (i = href.indexOf("/:#{p}/")) >= 0
				href = "#{href.substring(0, i)}/#{req.params[p]}/#{href.substring(i+3+p.length)}"
		if docs.length is cfg.limit
			objs["paginationlink"] = {"nextlink.href": href}
		cb req, res, docs, objs


#
# * establishes the routes implied by nakedRoute and skipRoute,
# * converting the cfg object to a list of parameters
#
setupPaginateList = (env, cfg, cb) ->
	cfg.skipRoute = cfg.nakedRoute	unless cfg.skipRoute
	cfg.skipRoute += "/"	unless cfg.skipRoute[cfg.skipRoute.length - 1] is "/"
	env.app.get cfg.nakedRoute, (req, res, next) ->
		showPaginatedList env, req, res, next, cfg, 0, cb, cfg.skipRoute

	env.app.get cfg.skipRoute + ":skip", (req, res, next) ->
		showPaginatedList env, req, res, next, cfg, parseInt(req.params.skip, 10), cb, cfg.skipRoute

exports.setupPagLst = setupPaginateList
