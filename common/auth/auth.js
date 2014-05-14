// Generated by CoffeeScript 1.7.1
(function() {
  var crypto, guest;

  crypto = require("../../justsayno.de/crypto");

  guest = require("./schema/guest").name;

  module.exports = function(env) {
    var EmailVerification, Guest, authenticate, mailer, sendVerification, sendVerwDoc, validateNewRego;
    mailer = require("../../justsayno.de/mail")(env);
    Guest = env.db.model(guest);
    EmailVerification = (function() {
      function EmailVerification(secret) {
        if (secret) {
          this.cipher = crypto.crypto.createCipher("aes-256-cbc", secret);
          this.decipher = crypto.crypto.createDecipher("aes-256-cbc", secret);
        }
      }

      EmailVerification.prototype.encrypt = function(text) {
        var crypted;
        if (text) {
          crypted = this.cipher.update(text, "utf8", "hex");
          crypted += this.cipher.final("hex");
        }
        return crypted;
      };

      EmailVerification.prototype.decrypt = function(text) {
        var dec;
        if (text) {
          dec = this.decipher.update(text, "hex", "utf8");
          dec += this.decipher.final("utf8");
        }
        return dec;
      };

      return EmailVerification;

    })();
    authenticate = function(name, pass, cb) {
      return Guest.findOne({
        handle: name
      }, function(err, doc) {
        if (err) {
          throw err;
        }
        if (!doc) {
          return cb(name);
        }
        if (!doc.salt && pass !== doc.pass) {
          return cb("");
        } else if (crypto.hashPassword(pass, doc.salt) !== doc.pass) {
          return cb("");
        }
        delete doc.pass;
        delete doc.salt;
        return cb(doc._doc);
      });
    };
    validateNewRego = function(name, email, cb) {
      return Guest.find({
        handle: name
      }, function(err, docs) {
        if (err) {
          throw err;
        }
        if (docs.length) {
          return cb(name);
        }
        return Guest.find({
          email: email
        }, function(err, docs) {
          if (err) {
            throw err;
          }
          if (docs.length === 0) {
            return cb();
          } else {
            return cb(email);
          }
        });
      });
    };
    sendVerwDoc = function(env, handle, doc) {
      var confirmlink, delay, encoded, encrypter, expireDate, g, mailClient, msg;
      g = doc._doc;
      expireDate = new Date();
      delay = expireDate.getTime();
      expireDate.setDate(expireDate.getDate() + 2);
      doc.expireOnNoVerify = expireDate;
      doc.save(function(err) {
        if (err) {
          throw err;
        }
      });
      delay = expireDate.getTime() - delay;
      setTimeout((function() {
        return Guest.findOne({
          handle: handle
        }, function(err, doc) {
          if (doc && doc.expireOnNoVerify) {
            doc.expireOnNoVerify = null;
            return doc.save(function(err) {
              if (err) {
                throw err;
              }
            });
          }
        });
      }), delay);
      encrypter = new EmailVerification(g.email);
      encoded = encrypter.encrypt(g.pass);
      confirmlink = "" + env.url + "/confirm/" + handle + "/" + encoded;
      mailClient = mailer.connect();
      msg = {
        to: "" + g.handle + " <" + g.email + ">",
        subject: "Please confirm your account",
        html: "<p>Click on this link to verify your account:<br>" + "<a href='" + confirmlink + "'>" + confirmlink + "</a></p>" + "<p>This link will expire in two days</p>"
      };
      return mailer.send(mailClient, msg, function(error, resp) {
        if (error) {
          console.dir(msg);
          console.log("error sending confirmation for " + handle + " to " + g.email);
          console.dir(error);
          if (resp && resp.length) {
            return console.log("got response: " + resp);
          }
        }
      });
    };
    sendVerification = function(env, handle, doc) {
      if (!doc) {
        return Guest.findOne({
          handle: handle
        }, function(err, doc) {
          if (doc) {
            return sendVerwDoc(env, handle, doc);
          }
        });
      }
    };
    Guest.find({
      expireOnNoVerify: {
        $ne: null
      }
    }, function(err, docs) {
      if (!err && docs.length) {
        return docs.forEach(function(err, i) {
          var delay, expire, expireDate, g;
          g = docs[i];
          expireDate = new Date();
          delay = expireDate.getTime();
          expire = g.expireOnNoVerify.getTime();
          if (expire < delay) {
            delay = 0;
          } else {
            delay = expire - delay;
          }
          return setTimeout((function() {
            return Guest.findOne({
              handle: g.handle
            }, function(err, doc) {
              if (!err && doc) {
                if (doc.expireOnNoVerify) {
                  return Guest.remove({
                    _id: doc._id
                  }, function(err) {
                    if (err) {
                      throw err;
                    }
                  });
                }
              }
            });
          }), delay);
        });
      }
    });
    env.app.get("/logout", function(req, res) {
      if (req.session.user) {
        if (req.session.user.remember) {
          delete req.session.user.pass;
        } else {
          delete req.session.user;
        }
        req.session.save();
      }
      return res.send("/", 303);
    });
    env.app.post("/login", function(req, res) {
      return authenticate(req.body.login, req.body.password, function(u) {
        if (typeof u !== "object") {
          return res.send(u, 404);
        }
        req.session.user = _.clone(u);
        req.session.user.remember = req.body.remember;
        delete u.pass;
        if (req.body.remember) {
          req.session.cookie.maxAge = 86400000000;
        } else {
          if (req.session.cookie) {
            req.session.cookie.expires = false;
          }
        }
        return env.respond(req, res, null, null, u);
      });
    });
    env.app.get("/silent_login", function(req, res) {
      if (!req.session.user) {
        return res.send("", 404);
      }
      if (req.session.user.pass) {
        return env.respond(req, res, null, null, req.session.user);
      } else {
        return res.send(req.session.user.handle, 404);
      }
    });
    env.app.post("/register", function(req, res) {
      return validateNewRego(req.body.login, req.body.email, function(u) {
        var g, password_salt;
        if (u) {
          return res.send(u, 404);
        }
        password_salt = crypto.generateSalt();
        g = new Guest({
          handle: req.body.login,
          email: req.body.email,
          salt: password_salt,
          algo: crypto.hashAlgorithm,
          pass: crypto.hashPassword(req.body.password, password_salt),
          verified: false
        });
        return g.save(function(err) {
          if (err) {
            console.log("ERROR adding new user " + g.handle);
            delete req.session.user;
            g = {};
          } else {
            req.session.user = _.clone(g);
            sendVerification(env, g.handle);
            console.log("added new user " + g.handle + " & sent confirmation to " + req.body.email);
          }
          delete g.pass;
          return env.respond(req, res, null, null, g);
        });
      });
    });
    env.app.post("/verify/:user", function(req, res) {
      return Guest.findOne({
        handle: req.params.user
      }, function(err, doc) {
        if (!err && doc) {
          return sendVerification(env, req.params.user, doc);
        }
      });
    });
    env.app.get("/verify/:user", function(req, res) {
      return Guest.findOne({
        handle: req.params.user
      }, function(err, doc) {
        if (!err && doc) {
          if (!doc.verified) {
            sendVerification(env, req.params.user, doc);
            return res.send("not found", 404);
          }
        }
      });
    });
    return env.app.get("/confirm/:user/:encoded_pass", function(req, res) {
      return Guest.findOne({
        handle: req.params.user
      }, function(err, doc) {
        var decoded, decrypter;
        if (err || !doc) {
          return res.send("Invalid user", 404);
        }
        decrypter = new EmailVerification(doc.email);
        decoded = decrypter.decrypt(req.params.encoded_pass);
        if (decoded !== doc.pass) {
          return res.send("Invalid confirmation code " + decoded, 404);
        }
        if (!doc.expireOnNoVerify) {
          req.session.user = _.clone(doc._doc);
          sendVerification(env, req.params.user, doc);
          return res.send("confirmation code expired - a new code has been sent to your email", 404);
        }
        doc.expireOnNoVerify = null;
        doc.verified = true;
        doc.save(function(err, docs) {
          if (err) {
            throw err;
          }
        });
        req.session.user = _.clone(doc._doc);
        return res.redirect("/");
      });
    });
  };

}).call(this);

//# sourceMappingURL=auth.map
