
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var justsayadminSchema = new Schema({
    name	: String			// display name
  , login	: String			// login name
  , passwd	: String			// password - TODO : hash
  , appname	: String			// appname, or blank for all ...
}, {strict:false});
mongoose.model('justsayAdmins', justsayadminSchema);

var justsayadfieldSchema = new Schema({
    name	: String					// field name
  , appname	: { type:String, index:true }			// appname
  , table	: { type:String, index:true }			// schema name 
  , listed	: { type:Boolean, default:true }		// is it in the list?
  , edited	: { type:Boolean, default:true }		// is it editable?
  , listwidth	: { type:Number, default:44 }			// field width in list
  , editwidth	: { type:Number, default:44 }			// field width in form
  , listflags	: { type:String, default:'' }			// field specific formatting
  , editflags	: { type:String, default:'' }			// field specific widget
  , listorder	: Number					// need to set list position order on insert
  , editorder	: Number					// need to set edit layout order on insert
});

justsayadfieldSchema.virtual('widthedit') 
  .get( function () { 
    return this.editwidth + 'px';
  }).set(function(v){ 
    ;
  }); 

justsayadfieldSchema.virtual('widthlist') 
  .get( function () { 
    return this.listwidth + 'px';
  }).set(function(v){ 
    ;
  }); 

mongoose.model('justsayAdminFields', justsayadfieldSchema);

module.exports.name = 'justsayAdmins';
module.exports.schema = justsayadminSchema;
