var Schema = require('mongoose').Schema;

var Transaction = module.exports =  new Schema({
	'value': {'type': Number, 'min': -1, 'max': 1}, // our vote, from -1 to 1 (the actual amount is calculated later)
	'class': String, // the type of transaction, e.g. 'vote', 'annotation'
	'author': String, // the user who made the transaction
	'date': {'type': Date, 'default': Date.now} // the time the transaction was made
});