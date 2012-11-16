
/*
 * this does the pagination logic, and primes the return object to include the nextlink where appropriate
 */
function showPaginatedList(env, req, res, next, model, query, fields, sort, limit, skip, cb, skipRoute) {
	var newq = {};
	for (i in query) {
		if (query[i].substr(0,11) == 'req.params.') {
			newq[i] = req.params[query[i].substr(11)];
		} else newq[i] = query[i];
	}

	model.find(newq, fields).sort(sort).limit(limit).skip(skip)
			.execFind( function(err, docs) {

				if (err) console.log('DEBUG : PAGINATE ERROR : ' + err);

				if (err || !docs || !docs.length) {
					env.respond(req, res, null, null, null);
				} else {
					var objs = {};
                    var href = skipRoute + (limit + skip);
                    for (p in req.params){
                        var tst = '/:' + p + '/';
                        var i = href.indexOf(tst);
                        if (i >= 0){
                            href = href.substring(0,i) + '/' + req.params[p] + '/' + href.substring(i+3+p.length)
                        }
                    }
					if (docs.length == limit)
						objs['paginationlink'] = {'nextlink.href': href};
					cb(req, res, docs, objs, skip);
				}
			});
}


/*
 * establishes the routes implied by nakedRoute and skipRoute,
 * converting the cfg object to a list of parameters
 */
function setupPaginateList(env, cfg, cb) {
    if (!cfg.skipRoute) {
        cfg.skipRoute = cfg.nakedRoute;
    }
    if (cfg.skipRoute[cfg.skipRoute.length-1] != '/') {
        cfg.skipRoute += '/';
    }
	env.app.get(cfg.nakedRoute, function(req, res, next) {
		showPaginatedList(env, req, res, next, cfg.model, cfg.query, cfg.fields, cfg.sort, cfg.limit, 0, cb, cfg.skipRoute);
	});
	env.app.get(cfg.skipRoute+':skip', function(req, res, next) {
		showPaginatedList(env, req, res, next, cfg.model, cfg.query, cfg.fields, cfg.sort, cfg.limit, parseInt(req.params.skip, 10), cb, cfg.skipRoute);
	});
}


exports.setupPagLst = setupPaginateList;

