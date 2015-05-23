var	mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var BlogPostSchema = new Schema({
  name	: String
  , title	: String
  , teaser	: String
  , body	: String
  , created_date	: Date
  , modified_date	: Date
});
mongoose.model('BlogPost', BlogPostSchema);

module.exports.name = 'BlogPost';
module.exports.schema = BlogPostSchema;
