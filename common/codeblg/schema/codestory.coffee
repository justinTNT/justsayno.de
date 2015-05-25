mongoose = require "mongoose"
Schema = mongoose.Schema
ObjectId = Schema.ObjectId
CodestorySchema = new Schema
	name: String
	title: String
	teaser: String
	comment: String
	body: String
	tags: [ObjectId]
	created_date: Date
	modified_date: Date

mongoose.model "Codestory", CodestorySchema
module.exports.name = "Codestory"
module.exports.schema = CodestorySchema
