var Schema = require('mongoose').Schema;

var Person = module.exports = new Schema({
	'id': {'type': Schema.ObjectId, 'index': true},
	'username': String,
	'name': String,
	'avatar': String
});
