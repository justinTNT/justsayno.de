
var	mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var CardSchema = new Schema({
  name	: String
  , title	: String
  , longtitle	: String
  , description     : String
  , tag : String
  , phone : String
  , mobile : String
  , fax : String
  , postal : String
  , street : String
  , link : String
  , fb : String
  , twit : String
  , goog : String
  , contactemail : String
  , use_email : Boolean
  , use_dmail : Boolean
  , upgrade : Boolean
  , redirect : Boolean
  , page : String
  , created_date	: Date
  , modified_date	: Date
});
mongoose.model('Card', CardSchema);

module.exports.name = 'Card';
module.exports.schema = CardSchema;
