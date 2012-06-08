var	mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MenuSchema = new Schema({
  name : String
  , title : String
  , link : String
  , item : String
  , parent_item : String
  , order : Number
});
mongoose.model('Menu', MenuSchema);

module.exports.name = 'Menu';
module.exports.schema = MenuSchema;
