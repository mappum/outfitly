var auth = require('connect-auth'),
	config = require(__dirname + '/../config.js');

module.exports = function(app) {
	//TODO: use more secure strategies
	app.use(auth({
		strategies: [
			auth.Facebook(config.facebook),
			auth.Twitter(config.twitter)
		]
	}));
};
