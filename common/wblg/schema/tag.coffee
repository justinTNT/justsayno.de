mongoose = require "mongoose"
Schema = mongoose.Schema
TagSchema = new Schema
	name: String

mongoose.model "Tag", TagSchema
module.exports.name = "Tag"
module.exports.schema = TagSchema
