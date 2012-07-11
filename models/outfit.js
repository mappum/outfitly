var Schema = require('mongoose').Schema,
	Comment = require(__dirname + '/comment.js');

var Item = new Schema({
	'url': String,
	'image': String,
	'name': String
});

var Outfit = module.exports = new Schema({
	'title': {'type': String},
	'author': {'type': Schema.ObjectId, 'index': true},
	'caption': {'type': String},
	'images': [String],
	'items': [Item],

	'original': {'type': String, 'sparse': true},

	'date': {'type': Date, 'default': Date.now, 'index': true},
	
	'comments': [Comment],
	'likes': [Schema.ObjectId],

	'stats': {
		'likes': {'type': Number, 'default': 0},
		'reposts': {'type': Number, 'default': 0},
		'comments': {'type': Number, 'default': 0}
	}
});
