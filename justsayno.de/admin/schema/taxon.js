
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var taxonomySchema = new Schema({
  vocab	: String			// vocabulary this item belongs to
  , taxon	: String		// the unique item 
  , appname	: String	
});
mongoose.model('taxon', taxonomySchema);

module.exports.name = 'taxon';
module.exports.schema = taxonomySchema;
