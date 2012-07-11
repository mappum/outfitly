var Schema = require('mongoose').Schema;

var Comment = module.exports = new Schema({	
	'author': {'type': Schema.ObjectId},
	'body': {'type': String},
	'date': {'type': Date}
});
