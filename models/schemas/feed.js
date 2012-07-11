var Schema = require('mongoose').Schema;

var Feed = module.exports = new Schema({
	'_id': {'type': String, 'index': { 'unique': true }},
	'tags': [String],
	
	'meta': {
		'date': {'type': Date, 'default': Date.now},
		'icon': {'type': String, 'default': 'list'},
		'description': String,
		'creator': String,
		'admins': [String]
	}
});
