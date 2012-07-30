var Schema = require('mongoose').Schema,
	ObjectId = Schema.ObjectId,
	Person = require(__dirname + '/person.js');

var Piece = new Schema({
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
	'image': String,
	'pieces': [Piece],

	'original': {
		'id': {'type': ObjectId, 'sparse': true},
		'username': String,
		'name': String,
		'avatar': String
	},

	'date': {'type': Date, 'default': Date.now, 'index': true},
	
	'comments': [Comment],
	'likes': [Person],
	'reposts': [Person],

	'stats': {
		'likes': {'type': Number, 'default': 0},
		'reposts': {'type': Number, 'default': 0},
		'comments': {'type': Number, 'default': 0},
		'pieces': {'type': Number, 'default': 0}
	}
});
