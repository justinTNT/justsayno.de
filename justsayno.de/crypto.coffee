# password related functions based on nodejs's crypto module

crypto = require 'crypto'
hashAlgorithm = 'sha512'

generateSalt = ->
	'' + uniqueHex 32
	
hashPassword = (password, salt) ->
	pwdHash = crypto.createHash hashAlgorithm
	pwdHash.update password + '' + salt
	pwdHash.digest 'hex'

verifyHash = (hash, salt, password) ->
	hashPassword(password, salt) is hash

# generate a unique hex string: well, a hex-like alphanumeric string, y'no ...
uniqueHex = (length=8) ->
	id = ""
	id += Math.random().toString(36).substr(2) while id.length < length
	id.substr 0, length

module.exports.generateSalt = generateSalt
module.exports.hashPassword = hashPassword
module.exports.verifyHash = verifyHash
module.exports.hashAlgorithm = hashAlgorithm
module.exports.uniqueHex = uniqueHex
module.exports.crypto = crypto

