var Schema = require('mongoose').Schema;

var Notification = module.exports = new Schema({
	'content': String,
	'date': {'type': Date, 'default': Date.now},
	'unread': {'type': Boolean, 'default': true}
});