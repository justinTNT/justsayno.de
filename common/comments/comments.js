// Generated by CoffeeScript 1.7.1
(function() {
  var commm, ft, _;

  ft = require("../../justsayno.de/fieldtools");

  commm = require("./schema/comment").name;

  _ = require("underscore");

  module.exports = function(env) {
    var Comment, Mailer, comment, countComments;
    Mailer = require("../../justsayno.de/mail")(env);
    countComments = function(s, cb) {
      s = s != null ? s.replace(/\//g, " ") : void 0;
      return Comment.count({
        subject: s
      }, cb);
    };
    comment = function(req, res, p) {
      var c, o;
      o = {
        subject: req.params.subject,
        name: req.session.user.handle,
        link: req.session.user.link,
        comment: req.body.comment
      };
      if (p) {
        o.parent = p;
      }
      c = new Comment(o);
      return c.save(function(err) {
        var mailClient;
        if (err) {
          res.send("failed to save comment: " + err, 404);
          throw err;
        }
        mailClient = Mailer.connect();
        return Mailer.send(mailClient, {
          to: env.admintoemail,
          subject: "new comment on " + env.appname,
          html: "<p>New comment from: " + o.name + "<br> " + o.comment + "<br> at " + o.subject + "</p>"
        }, function(err, resp) {
          if (err) {
            console.log("alerting new comment => mail fail: " + err);
          } else {
            console.log("alerted " + env.admintoemail + " about comment on " + env.appname);
          }
          return res.send("OK");
        });
      });
    };
    Comment = env.db.model(commm);
    env.app.get("/:subject/comments", function(req, res) {
      var which_fields;
      which_fields = ["subject", "name", "comment", "link", "_id", "parent"];
      return Comment.find({
        subject: req.params.subject
      }, ft.toStr(which_fields), function(err, docs) {
        var o;
        if (docs != null ? docs.length : void 0) {
          o = ft.translateFields(docs, which_fields);
        } else {
          o = null;
        }
        return env.respond(req, res, null, null, o);
      });
    });
    env.app.post("/:subject/comment", function(req, res) {
      return comment(req, res);
    });
    env.app.post("/:subject/comment/:parent", function(req, res) {
      return comment(req, res, req.params.parent);
    });
    return countComments;
  };

}).call(this);

//# sourceMappingURL=comments.map
