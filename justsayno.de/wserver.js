// Generated by CoffeeScript 1.6.2
(function() {
  var configureAppEnv, express, fs, getProxy, http, mongoStore, mongoose, net, os, proxies, proxy_server, schemetools, setProxy, setupFavico, setupRoutes, setupServer, temptools, webserver_app;

  fs = require('fs');

  os = require('os');

  net = require('net');

  http = require('http');

  express = require('express');

  mongoose = require('mongoose');

  mongoStore = require('connect-mongo')(express);

  temptools = require('./temptools');

  schemetools = require('./schemetools');

  proxies = {};

  configureAppEnv = function(e) {
    var clandestine;

    clandestine = ("" + e.clandestine + "_") + os.hostname() + ("_" + e.appname);
    if (e.targetapp) {
      clandestine = "" + clandestine + "_" + e.targetapp;
    }
    temptools.configureTemplates(e);
    e.app.use(express.staticCache());
    e.app.use(express.bodyParser());
    e.app.use(express.cookieParser(clandestine));
    e.app.use(express.cookieSession({
      key: e.targetapp ? "" + e.targetapp + "-admin.sid" : "" + e.appname + ".sid"
    }));
    e.app.use('/browser/', express["static"]("" + e.dir + "/browser/"));
    e.app.use(express.logger({
      immediate: true,
      format: '[:date] ' + e.appname + ' :remote-addr ":method :url" :status ":referrer"'
    }));
    e['hook'] = [];
    return e.app;
  };

  setupFavico = function(ea, done) {
    var d;

    d = "" + __dirname + "/../apps/" + ea.env.appname + "/browser/favicon.ico";
    return fs.stat(d, function(err, stat) {
      if (err) {
        ea.app.use(express.favicon());
      } else {
        ea.app.use(express.favicon(d));
      }
      return done(ea);
    });
  };

  /*
  ** configure templates; setup serving of browser files (scripts, css, favicon)
  ** and ensuring that ajax pages get a basic skeleton.
  ** ---------------
  ** it's important to know where all the routing is,
  ** cos the first attempt to add a route cements the middleware priority
  ** much easier if it's all in one spot, so:
  */


  setupRoutes = function(ea) {
    return setupFavico(ea, function(a) {
      var plugin, _i, _len, _ref;

      a.app.get("/" + a.env.appname + ".css", function(req, res) {
        res.contentType('text/css');
        return res.send(a.env.cssstring);
      });
      a.app.get("/" + a.env.appname + ".js", function(req, res) {
        res.contentType('text/javascript');
        return res.send(a.env.scriptplatestring);
      });
      if (a.env.plugins) {
        _ref = a.env.plugins;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          plugin = _ref[_i];
          a.env.hook[plugin] = require("../common/" + plugin + "/" + plugin + ".js")(a.env);
        }
      }
      a.setRoutes();
      /*
      		* and finally, this makes sure that ajax pages serve up the skeleton
      		* in the case of where there is nothing else to server at the route
      		* i.e. it's all built on the client by a script
      */

      return a.app.get(/\/$/, function(req, res) {
        return a.env.respond(req, res, a.env.basetemps);
      });
    });
  };

  /*
   * setupServer - prepare to listen for http connections
   * -----------
   *  all trafic comes through the closure in here.
   *  if it's not for one of our apps, we check the proxies.
   *  if it's
   *  port : port to listen for HTTP trafic
   *  applist : list of apps served by this webserver
   *  ip : optional IP to listen on - in case our box has more than one
   *  passon : an object containing properties that should be passed on to each app env
  */


  webserver_app = null;

  setupServer = function(port, applist, ip, setuid, passon) {
    var admdb, app, dbs, dname, e, eachapp, key, n, this_admin, webserverserver, _i, _j, _len, _len1, _ref;

    webserver_app = express();
    admdb = mongoose.createConnection(schemetools.URIofDB(passon.mongopts, 'justsayadmin'));
    dbs = [admdb];
    for (_i = 0, _len = applist.length; _i < _len; _i++) {
      app = applist[_i];
      n = app.appname;
      if (!_.isArray(app.dname)) {
        app.dname = [app.dname];
      }
      eachapp = require('../apps/' + n + '/' + n + '_app');
      e = eachapp.env;
      if (e) {
        e.appname = n;
        e.url = app.dname[0];
        for (key in passon) {
          if (!e[key]) {
            e[key] = passon[key];
          }
        }
        eachapp.app = configureAppEnv(e);
        setupRoutes(eachapp);
        this_admin = require('./admin/admin')(e, admdb);
        this_admin.app = configureAppEnv(this_admin.env);
        setupRoutes(this_admin);
        webserver_app.use(express.vhost("admin." + e.url, this_admin.app));
        schemetools.configureDBschema(admdb, e);
        e.db = mongoose.createConnection(schemetools.URIofDB(e.mongopts, n));
        dbs.push(e.db);
      }
      _ref = app.dname;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        dname = _ref[_j];
        webserver_app.use(express.vhost(dname, eachapp.app));
        webserver_app.use(express.vhost("www." + dname, eachapp.app));
      }
    }
    webserver_app.use(express.logger());
    webserver_app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
    /*
    	// see above, we .use vhosts for all matching apps.
    	// if we match in this catch-all, its cos the host is not one we're serving.
    	// either it's one we're proxying for, or it's a mystery host ...
    */

    webserver_app.all('*', function(req, res) {
      var p, proxy, proxy_request;

      if (proxies && (p = proxies[req.header('Host')])) {
        proxy = http.createClient(80, p);
        proxy.addListener('error', function() {
          console.log('Proxy connection failed');
          return proxies[req.header('Host')] = void 0;
        });
        proxy_request = proxy.request(req.method, req.url, req.headers);
        proxy_request.addListener('response', function(proxy_response) {
          proxy_response.addListener('data', function(chunk) {
            return res.write(chunk, 'binary');
          });
          proxy_response.addListener('end', function() {
            console.log(("passing " + req.url + " response from ") + req.header('Host') + ' via proxy.');
            return res.end();
          });
          proxy_response.addListener('error', function(e) {
            console.log('proxy_response error');
            console.log(e);
            console.log(proxy_response);
            return res.end();
          });
          return res.writeHead(proxy_response.statusCode, proxy_response.headers);
        });
        req.addListener('data', function(chunk) {
          return proxy_request.write(chunk, 'binary');
        });
        req.addListener('end', function() {
          console.log(("PASSING " + req.url + " request for ") + req.header('Host') + ' via proxy.');
          return proxy_request.end();
        });
        return req.addListener('error', function(e) {
          console.log('req error');
          console.log(e);
          console.log(req);
          return proxy_request.end();
        });
      } else if (req.headers.connection !== 'keep-alive') {
        return console.log('also seen: ' + JSON.stringify(req.headers));
        /*
        			* note: see that return above? that's when we found a proxy to send it to.
        			*       if we got down this far, its cos we have an un-handled request.
        			*       not worth dying over, but probably worth logging ...
        */

      }
    });
    console.log('listen to ' + (ip ? ip : 'localhost') + (" on " + port));
    webserverserver = webserver_app.listen(port, ip);
    webserverserver.on('listening', function() {
      if (setuid) {
        console.log("stepping down to " + setuid);
        return process.setuid(setuid);
      }
    });
    process.on("SIGINT", function() {
      var i, proxy_server, _k, _ref1;

      console.log('closing webservers ...');
      if (proxy_server) {
        proxy_server.close();
        proxy_server = null;
      }
      for (i = _k = 0, _ref1 = dbs.length; 0 <= _ref1 ? _k <= _ref1 : _k >= _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
        dbs[i].close();
      }
      if (webserverserver) {
        webserverserver.close();
        webserverserver = null;
      }
      return console.log(' ... webservers closed.');
    });
    webserverserver.on('close', function() {
      return console.log('webserver closing');
    });
    return proxy_server.on('close', function() {
      return console.log('proxyserver closing');
    });
  };

  getProxy = function(name, port, clandestine, proxies) {
    var c;

    c = net.createConnection(port, name);
    c.on('connect', function(s) {
      var i, _i, _ref;

      console.log("connected to proxy server at " + name + ":" + port);
      for (i = _i = _ref = proxies.length - 1; _ref <= 0 ? _i < 0 : _i > 0; i = _ref <= 0 ? ++_i : --_i) {
        c.write(proxies[i] + ' ');
      }
      return c.write(clandestine);
    });
    c.on('end', function(e) {
      console.log('config connection to proxy server ended.');
      return c.end();
    });
    return c.on('error', function(e) {
      console.log('config connection to proxy server failed.');
      throw e;
    });
  };

  proxy_server = null;

  setProxy = function(port, ip, clandestine) {
    var prollyproxy;

    prollyproxy = {};
    return proxy_server = net.createServer(function(s) {
      var remote_ip;

      console.log('creating proxy server');
      remote_ip = s.remoteAddress;
      s.on('data', function(d) {
        var aStr, i, _i, _j, _len, _ref, _results;

        aStr = String(d).split(' ');
        _results = [];
        for (i = _i = 0, _ref = aStr.length; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          if (aStr[i] === clandestine) {
            for (_j = 0, _len = prollyproxy.length; _j < _len; _j++) {
              d = prollyproxy[_j];
              proxies[d] = prollyproxy[d];
              console.log("authorised redirecting : " + d + " to " + proxies[d]);
            }
            _results.push(s.end());
          } else if (aStr[i].length) {
            console.log("redirection requested for : " + aStr[i] + " to " + remote_ip);
            _results.push(prollyproxy[aStr[i]] = remote_ip);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
      return s.on('error', function(e) {
        return console.log('proxy read error!');
      });
    }).listen(port, ip);
  };

  exports.setupServer = setupServer;

  exports.setProxy = setProxy;

  exports.getProxy = getProxy;

  exports.server = webserver_app;

}).call(this);

/*
//@ sourceMappingURL=wserver.map
*/
