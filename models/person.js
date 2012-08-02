var Schema = require('mongoose').Schema;

var Person = module.exports = {
	'_id': {'type': Schema.ObjectId, 'index': {'unique': true}},
	'username': String,
	'name': String,
	'avatar': String
};