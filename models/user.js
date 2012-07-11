var Schema = require('mongoose').Schema;

function longerThan(n) {
	return function(s) { return s.length > n; };
}

var User = module.exports = new Schema({
	'name': String,
	'username': {'type': String, 'index': {'unique': true}, 'validate': longerThan(3)},
	'email': {'type': String, 'index': {'unique': true}, 'validate': longerThan(4)},

	'verified': Boolean,
	
	'password': {
		'hash': String,
		'salt': String
	},
	
	'date': Date,
	'description': String,
	'from': String,
	'avatar': String,

	'stats': {
		'posts': {'type': Number, 'default': 0},
		'likes': {'type': Number, 'default': 0},
		'reposts': {'type': Number, 'default': 0},
		'followers': {'type': Number, 'default': 0},
		'following': {'type': Number, 'default': 0}
	},

	'followers': [Schema.ObjectId],
	'following': [Schema.ObjectId],
	
	'externals': {
		'facebook': {'type': String, 'sparse': true},
		'twitter': {'type': String, 'sparse': true}
	}
});