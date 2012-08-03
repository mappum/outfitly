var config = require(__dirname + '/../config.js'),
	controllers = require(__dirname + '/../controllers'),
	auth = controllers.auth,
	outfits = controllers.outfits,
	users = controllers.users;

function requireLogin(req, res, next) {
	if(req.session.userId) next();
	else res.error(401);
};

function requireLogout(req, res, next) {
	if(req.session.userId) res.error(401);
	else next();
};

function requireVerification(req, res, next) {
	if(req.session.user.verified || !config.mail.requireVerification) next();
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
	// repost outfit
	app.get('/outfits/:id/repost', requireLogin, requireVerification, outfits.repost);
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
	// create new user (register)
	app.post('/users', users.create);
	// read user profile
	app.get('/users/:id', users.read);
	// update profile
	app.put('/users/:id', requireLogin, users.update);
	// delete profile
	app.delete('/users/:id', requireLogin, users.delete);
	// check if username is available
	app.get('/users/:username/exists', users.usernameAvailable);
	
	// redirect get requests to hashpath
	app.get('*', function(req, res) {
		res.redirect('/#' + req.path);
	});
	
	// all other requests are no bueno
	app.all('*', function(req, res) {
		res.error(404);
	});
};
