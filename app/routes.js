var config = require(__dirname + '/../config.js'),
	controllers = require(__dirname + '/../controllers'),
	auth = controllers.auth,
	outfits = controllers.outfits,
	users = controllers.users,
	products = controllers.products;

function requireLogin(req, res, next) {
	if(typeof req.session.userId !== 'undefined') next();
	else res.error(401);
}

function requireLogout(req, res, next) {
	if(typeof req.session.userId === 'undefined') next();
	else res.error(401);
}

function requireVerification(req, res, next) {
	if((req.session.user.verified || !config.mail.requireVerification) &&
		req.session.user.complete) next();
	else res.error(401);
}

module.exports = function(app) {
	// ********** routes for auth requests **********
	// login with normal POST method
	app.post('/auth', requireLogout, auth.login);
	// check our auth status
	app.get('/auth/info', requireLogin, auth.info);
	// login or link with external auth
	app.get('/auth/:method', auth.auth);
	// handle external auth callback
	app.get('/auth/callback/:method', auth.callback);
	// logout
	app.get('/logout', auth.logout);
	
	// ********** routes for outfits **********
	// main feed
	app.get('/outfits', outfits.readFeed);
	// create new outfit
	app.post('/outfits', requireLogin, requireVerification, outfits.create);
	// read full item
	app.get('/outfits/:id', outfits.read);
	// update existing outfit
	app.put('/outfits/:id', requireLogin, requireVerification, outfits.update);
	// delete outfit
	app.delete('/outfits/:id', requireLogin, requireVerification, outfits.delete);
	// like outfit
	app.post('/outfits/:id/likes', requireLogin, requireVerification, outfits.getById, outfits.like);
	// unlike outfit
	app.delete('/outfits/:id/likes', requireLogin, requireVerification, outfits.getById, outfits.unlike);
	// repost outfit
	app.post('/outfits/:id', requireLogin, requireVerification, outfits.getById, outfits.repost);
	// unrepost outfit
	app.delete('/outfits/:id/reposts', requireLogin, requireVerification, outfits.getById, outfits.unrepost);
	
	// ********** routes for comments **********
	// create new comment
	app.post('/outfits/:id/comments', requireLogin, requireVerification,
		outfits.getById, outfits.comments.create);
	// update commento
	app.put('/outfits/:id/comments/:comment', requireLogin, requireVerification,
		outfits.getById, outfits.comments.getById, outfits.comments.update);
	// delete comment
	app.delete('/outfits/:id/comments/:comment', requireLogin,
		requireVerification, outfits.getById, outfits.comments.getById,
		outfits.comments.delete);
	
	// ********** routes for users **********
	// check if username is available
	app.get('/users/exists/:username', users.usernameAvailable);
	app.put('/users/exists', users.usernameAvailable);
	// create new user (register)
	app.post('/users', users.create);
	// read user profile
	app.get('/users/:id', users.read);
	// update profile
	app.put('/users/:id', requireLogin, users.update);
	// delete profile
	app.delete('/users/:id', requireLogin, users.delete);

	app.get('/info', function(req, res) {
		var os = require('os');
		res.json({
			hostname: os.hostname(),
			type: os.type(),
			platform: os.platform(),
			arch: os.arch(),
			release: os.release(),
			uptime: os.uptime(),
			loadavg: os.loadavg(),
			totalmem: os.totalmem(),
			freemem: os.freemem(),
			cpus: os.cpus(),
			networkInterfaces: os.networkInterfaces()
		});
	});

	// route for item search
	app.get('/products/:query', products.read);
	app.get('/products/:query/:page', products.read);
	app.post('/products', products.read);
	
	// redirect get requests to hashpath
	app.get('*', function(req, res) {
		res.redirect('http://' + config.meta.domain + '/#' + req.path);
	});
	
	// all other requests are no bueno
	app.all('*', function(req, res) {
		res.error(404);
	});
};
