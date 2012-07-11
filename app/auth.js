var auth = require('connect-auth'),
	controllers = require(__dirname + '/../controllers'),
	config = require(__dirname + '/../config.js');

module.exports = function(app) {
	//TODO: use more secure strategies
	//TODO: use other website strategies (facebook, twitter, etc)
	app.use(auth({
		strategies: [
			auth.Facebook(config.facebook)
		]
	}));
};
