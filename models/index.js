module.exports = {
	'User': mongoose.model('User', require(__dirname + '/user.js')),
	'Outfit': mongoose.model('Outfit', require(__dirname + '/outfit.js')),
};