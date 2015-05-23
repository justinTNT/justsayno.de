var	mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var StorySchema = new Schema({
  name	: String
  , title	: String
  , teaser	: String
  , body	: String
  , created_date	: Date
  , modified_date	: Date
});
mongoose.model('Story', StorySchema);

module.exports.name = 'Story';
module.exports.schema = StorySchema;
