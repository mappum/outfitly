var mongoose = require('mongoose'),
	schema = require('./schemas/feed.js');

module.exports = mongoose.model('Feed', schema);
