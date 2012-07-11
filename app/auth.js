var auth = require('connect-auth'),
	config = require(__dirname + '/../config.js');

module.exports = function(app) {
	//TODO: use more secure strategies
	app.use(auth({
		strategies: [
			auth.Facebook(config.externals.facebook),
			auth.Twitter(config.externals.twitter)
		]
	}));
};
