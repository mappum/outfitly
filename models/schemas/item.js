var Schema = require('mongoose').Schema,
	Comment = require('./comment.js'),
	Transaction = require('./transaction.js');

var Item = module.exports = new Schema({
	'title': {'type': String},
	'author': {'type': String},
	'body': {'type': String},
	'link': {'type': String},
	'class': {'type': String, 'lowercase': true}, // the type of post (e.g 'youtube', 'text')
	'tags': {'type': [String], 'index': true},
	'date': {'type': Date, 'default': Date.now},
	
	'comments': [Comment],
	
	'score': {'type': Number, 'default': 0},
	'transactions': [Transaction]
});
