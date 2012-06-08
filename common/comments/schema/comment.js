var	mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var CommentSchema = new Schema({
  subject	: String
  , parent		: ObjectId
  , created_date	: Date
  , name : String
  , link : String
  , comment : String
});
mongoose.model('Comment', CommentSchema);

module.exports.name = 'Comment';
module.exports.schema = CommentSchema;
