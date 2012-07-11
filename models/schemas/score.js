var Schema = require('mongoose').Schema;

var Score = module.exports = new Schema({
	'name': String,
	'tags': [String],
	'score': Number,
	'percentile': Number,
	'visibility': String
});