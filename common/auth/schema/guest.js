var	mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GuestSchema = new Schema({
  handle : String
  , pass : String
  , salt : String
  , email : String
  , created_date	: Date
  , expireOnNoVerify	: Date
  , verified : Boolean
});
mongoose.model('Guest', GuestSchema);

module.exports.name = 'Guest';
module.exports.schema = GuestSchema;
