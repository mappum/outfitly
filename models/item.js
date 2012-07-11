var mongoose = require('mongoose'),
	schema = require('./schemas/item.js');

module.exports = mongoose.model('Item', schema);
