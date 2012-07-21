var Schema = require('mongoose').Schema,
	Person = require(__dirname + '/person.js');

var Item = new Schema({
	'url': String,
	'image': String,
	'name': String
});

var Comment = new Schema({
	'author': Person,
	'body': String,
	'date': Date
});

var Outfit = module.exports = new Schema({
	'author': Person,
	'caption': String,
	'images': [String],
	'items': [Item],

	'original': {'type': String, 'sparse': true},

	'date': {'type': Date, 'default': Date.now, 'index': true},
	
	'comments': [Comment],
	'likes': [Person],

	'stats': {
		'likes': {'type': Number, 'default': 0},
		'reposts': {'type': Number, 'default': 0},
		'comments': {'type': Number, 'default': 0}
	}
});
