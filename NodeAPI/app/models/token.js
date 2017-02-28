var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Token', new Schema({
	token: String,
	expiresAt: Date,
	userName: String
}));