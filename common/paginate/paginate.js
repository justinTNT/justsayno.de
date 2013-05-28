// Generated by CoffeeScript 1.6.2
(function() {
  var setupPaginateList, showPaginatedList;

  showPaginatedList = function(env, req, res, next, cfg, skip, cb, skipRoute) {
    var i, newq;

    newq = {};
    for (i in cfg.query) {
      if (cfg.query[i].substr(0, 11) === "req.params.") {
        newq[i] = req.params[cfg.query[i].substr(11)];
      } else {
        newq[i] = cfg.query[i];
      }
    }
    return cfg.model.find(newq, cfg.fields).sort(cfg.sort).limit(cfg.limit).skip(skip).execFind(function(err, docs) {
      var href, objs, p;

      if (err) {
        console.log("DEBUG : PAGINATE ERROR : " + err);
      }
      if (err || !docs || !docs.length) {
        return env.respond(req, res, null, null, null);
      }
      objs = {};
      href = skipRoute + (cfg.limit + skip);
      for (p in req.params) {
        if ((i = href.indexOf("/:" + p + "/")) >= 0) {
          href = "" + (href.substring(0, i)) + "/" + req.params[p] + "/" + (href.substring(i + 3 + p.length));
        }
      }
      if (docs.length === cfg.limit) {
        objs["paginationlink"] = {
          "nextlink.href": href
        };
      }
      return cb(req, res, docs, objs, skip);
    });
  };

  setupPaginateList = function(env, cfg, cb) {
    if (!cfg.skipRoute) {
      cfg.skipRoute = cfg.nakedRoute;
    }
    if (cfg.skipRoute[cfg.skipRoute.length - 1] !== "/") {
      cfg.skipRoute += "/";
    }
    env.app.get(cfg.nakedRoute, function(req, res, next) {
      return showPaginatedList(env, req, res, next, cfg, 0, cb, cfg.skipRoute);
    });
    return env.app.get(cfg.skipRoute + ":skip", function(req, res, next) {
      return showPaginatedList(env, req, res, next, cfg, parseInt(req.params.skip, 10), cb, cfg.skipRoute);
    });
  };

  exports.setupPagLst = setupPaginateList;

}).call(this);

/*
//@ sourceMappingURL=paginate.map
*/