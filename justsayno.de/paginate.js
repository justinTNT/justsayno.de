
/*
 * this does the pagination logic, and primes the return object to include the nextlink where appropriate
 */
function showPaginatedList(env, req, res, model, query, fields, sort, direction, limit, skip, cb, skipRoute) {
	var newq = {};
	for (var i in query) {
		if (query[i].substr(0,11) == 'req.params.') {
			newq[i] = req.params[query[i].substr(11)];
		} else newq[i] = query[i];
	}

	model.find(newq, fields).sort(sort, direction).limit(limit).skip(skip)
			.execFind( function(err, docs) {
				if (err) throw err;

				if (!docs.length) {
					env.respond(req, res, null, null, null);
				} else {
					var objs = {};
					if (docs.length == limit)
						objs['paginationlink'] = {'nextlink.href': skipRoute + (limit + skip)};
					cb(req, res, docs, objs);
				}
			});
}


/*
 * establishes the routes implied by nakedRoute and skipRoute,
 * converting the cfg object to a list of parameters
 */
function setupPaginateList(env, cfg, cb) {
	env.app.get(cfg.nakedRoute, function(req, res) {
		showPaginatedList(env, req, res, cfg.model, cfg.query, cfg.fields, cfg.sort, cfg.direction, cfg.limit, 0, cb, cfg.skipRoute);
	});
	env.app.get(cfg.skipRoute+':skip', function(req, res) {
		showPaginatedList(env, req, res, cfg.model, cfg.query, cfg.fields, cfg.sort, cfg.direction, cfg.limit, req.params.skip, cb, cfg.skipRoute);
	});
}


exports.setupPagLst = setupPaginateList;
