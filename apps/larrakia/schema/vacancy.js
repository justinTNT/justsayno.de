var	mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var VacancySchema = new Schema({
  title	: String
  , project	: String
  , terms	: String
  , description	: String
  , attachment	: String
  , application_date	: Date
});
mongoose.model('Vacancy', VacancySchema);

module.exports.name = 'Vacancy';
module.exports.schema = VacancySchema;
