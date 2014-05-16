var express = require('express');

var env = {
    staticurl: "saymay.loc",
    app: express(),
    plugins: ['auth'],
	authdatabase: { name:'dmail' },
    dir: __dirname,
    basetemps: [
      {
        selector: "#boilerplate-container",
        filename: "darwin.jade"
      }
    ],
    s3: {
      key: 'AKIAICFLGBIGUIP4WEBA',
      secret: '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',
      bucket: 'isnt.so'
    }
  };

exports.setRoutes = function() {
	require('./darw_showem.js')(env);
};

exports.env = env;

