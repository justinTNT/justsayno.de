var	mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var NewsSchema = new Schema({
  name	: String
  , category	: String
  , title	: String
  , teaser	: String
  , body	: String
  , created_date	: Date
  , modified_date	: Date
});
mongoose.model('News', NewsSchema);

module.exports.name = 'News';
module.exports.schema = NewsSchema;
