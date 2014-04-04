// Generated by CoffeeScript 1.7.1
(function() {
  var ft;

  ft = require("../../justsayno.de/fieldtools");

  module.exports = function(env) {
    var Menu;
    Menu = env.db.model(require("./schema/menu").name);
    env.app.get("/menu/:menu_name", function(req, res) {
      return Menu.find({
        name: req.params.menu_name
      }).sort("-parent_item order").execFind(function(err, docs) {
        var all_objs, which_fields;
        if (err) {
          console.log(err);
        }
        if (docs.length) {
          which_fields = ["item", "parent_item", "order", "title", "link"];
          all_objs = ft.translateFields(docs, which_fields);
          return env.respond(req, res, null, null, all_objs);
        } else {
          return res.send("Invalid menu name: " + req.params.menu_name, 404);
        }
      });
    });
    return env.app.get("/justsay/listallmenus", function(req, res) {
      var which_fields;
      which_fields = "title link";
      return Menu.find({}, which_fields, function(err, docs) {
        var key, str;
        if (err) {
          console.log(err);
        }
        if (docs.length) {
          str = "<p>";
          for (key in docs) {
            str += "<a href='" + docs[key].link + "'>" + docs[key].title + "</a><br>";
          }
          str += "</p>";
          return env.respond(req, res, null, null, str);
        } else {
          return res.send("No menus", 404);
        }
      });
    });
  };

}).call(this);

//# sourceMappingURL=menu.map
