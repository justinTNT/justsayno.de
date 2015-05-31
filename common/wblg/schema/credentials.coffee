mongoose = require "mongoose"
Schema = mongoose.Schema
CredentialsSchema = new Schema
	name: String
	key: String
	secret: String

mongoose.model "Credentials", CredentialsSchema
module.exports.name = "Credentials"
module.exports.schema = CredentialsSchema
