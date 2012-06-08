var	mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GuestSchema = new Schema({
  handle : String
  , created_date	: Date
  , expireOnNoVerify	: Date
  , name : String
  , pass : String
  , link : String
  , email : String
  , avatar : String
});
mongoose.model('Guest', GuestSchema);

module.exports.name = 'Guest';
module.exports.schema = GuestSchema;
