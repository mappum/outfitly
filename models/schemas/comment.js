var Schema = require('mongoose').Schema,
	ObjectId = Schema.ObjectId,
	Transaction = require('./transaction.js');

var Comment = module.exports = new Schema({	
	'author': {'type': String},
	'body': {'type': String},
	'date': {'type': Date},
	
	'_parent': {'type': ObjectId},
	
	'score': {'type': Number, 'default': 0},
	'transactions': {'type': [Transaction]}
});
