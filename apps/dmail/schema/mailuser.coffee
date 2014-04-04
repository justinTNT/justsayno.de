mongoose = require 'mongoose'
Schema = mongoose.Schema

MailuserSchema = new Schema
	handle : String
	verifiedEmail : String
	haspage : Boolean
	disabled : Boolean
	complete : Boolean

mongoose.model 'Mailuser', MailuserSchema

module.exports.name = 'Mailuser'
module.exports.schema = MailuserSchema
