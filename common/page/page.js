var	mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var PageSchema = new Schema({
  name	: String
  , title	: String
  , teaser	: String
  , body	: String
  , created_date	: Date
  , modified_date	: Date
});
mongoose.model('Page', PageSchema);

module.exports.name = 'Page';
module.exports.schema = PageSchema;
