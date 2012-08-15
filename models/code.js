var Schema = require('mongoose').Schema;

var Code = module.exports = new Schema({
	'_id': {'type': String, 'index': {'unique': true}},

	'used': {'type': Boolean, 'default': false},
	'distributed': {'type': Boolean, 'default': false}
});
