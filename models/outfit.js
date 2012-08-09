var Schema = require('mongoose').Schema,
	ObjectId = Schema.ObjectId,
	Person = require(__dirname + '/person.js');

var Piece = new Schema({
	'url': {'type': String, 'match': /^http:\/\/www.amazon.com\/.+$/},
	'image': String,
	'title': String,
	'brand': String
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

	'private': {'type': String, 'default': false},

	'original': Person,

	'date': {'type': Date, 'default': Date.now, 'index': true},
	
	'comments': [Comment],
	'likes': [new Schema(Person)],
	'reposts': [new Schema(Person)],

	'stats': {
		'likes': {'type': Number, 'default': 0},
		'reposts': {'type': Number, 'default': 0},
		'comments': {'type': Number, 'default': 0},
		'pieces': {'type': Number, 'default': 0}
	}
});
