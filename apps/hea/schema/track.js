var	mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrackSchema = new Schema({
  track	: String
  , title	: String
  , handle	: String
  , artist	: String
  , created_date	: Date
  , modified_date	: Date
});
mongoose.model('Track', TrackSchema);

module.exports.name = 'Track';
module.exports.schema = TrackSchema;
