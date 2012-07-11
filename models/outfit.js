var Schema = require('mongoose').Schema,
	Comment = require(__dirname + '/comment.js');

var Outfit = module.exports = new Schema({
	'title': {'type': String},
	'author': {'type': Schema.ObjectId, 'index': true},
	'caption': {'type': String},

	'original': {'type': String, 'sparse': true},

	'date': {'type': Date, 'default': Date.now, 'index': true},
	
	'comments': [Comment],
	'likes': [Schema.ObjectId]
});
