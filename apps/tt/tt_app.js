// Generated by CoffeeScript 1.7.1
(function() {
  var env, express;

  express = require("express");

  env = {
    staticurl: "isnt.so",
    app: express(),
    plugins: ["auth", "comments", "wblg"],
    dir: __dirname,
    basetemps: [
      {
        selector: "#boilerplate-container",
        filename: "tt.jade"
      }
    ],
    s3: {
      key: 'AKIAICFLGBIGUIP4WEBA',
      secret: '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',
      bucket: 'isnt.so'
    }
  };

  exports.env = env;

}).call(this);

//# sourceMappingURL=tt_app.map
