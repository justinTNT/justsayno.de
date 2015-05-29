mongoose = require "mongoose"
Schema = mongoose.Schema
CodetagSchema = new Schema
	name: String

mongoose.model "Codetag", CodetagSchema
module.exports.name = "Codetag"
module.exports.schema = CodetagSchema
