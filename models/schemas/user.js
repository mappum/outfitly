var Schema = require('mongoose').Schema,
	Score = require('./score.js'),
	Notification = require('./notification.js');

function longerThan(n) {
	return function(s) { return s.length > n; };
}

var User = module.exports = new Schema({	
	'account': {
		'name': {
			'first': {'type': String, 'validate': longerThan(0)},
			'last': {'type': String, 'validate': longerThan(0)},
			'display': String
		},
		
		'email': {'type': String, 'index': {'unique': true}, 'validate': longerThan(4)},
		'verified': Boolean,
		
		'password': {
			'hash': String,
			'salt': String
		},
		
		'date': Date,
		'description': String,
		'avatar': String
	},
	
	'externals': {
		'facebook': {'type': String, 'sparse': true}
	},
	
	'scores': [Score],
	
	'notifications': [Notification]
});