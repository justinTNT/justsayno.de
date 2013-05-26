mongoose = require "mongoose"
Schema = mongoose.Schema
ObjectId = Schema.ObjectId
StorySchema = new Schema
	name: String
	url: String
	title: String
	image: String
	teaser: String
	comment: String
	body: String
	tags: [ObjectId]
	created_date: Date
	modified_date: Date

mongoose.model "Story", StorySchema
module.exports.name = "Story"
module.exports.schema = StorySchema
