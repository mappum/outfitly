var mongoose = require('mongoose'),
	schema = require('./schemas/user.js');

module.exports = mongoose.model('User', schema);
