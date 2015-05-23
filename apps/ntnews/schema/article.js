var	mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ArticleSchema = new Schema({
  aid	: Number
  , title	: String
  , attrib	: String
  , source	: String
  , body	: String
  , tag		: String
  , art_date	: Date
  , front	: Number
  , tease	: String
});
ArticleSchema.index({tag:1, created_date:-1}, {});
ArticleSchema.index({front:-1}, {});
mongoose.model('Article', ArticleSchema);

module.exports.name = 'Article';
module.exports.schema = ArticleSchema;
