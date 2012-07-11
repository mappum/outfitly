var config = require(__dirname + '/../config.js'),
	controllers = require(__dirname + '/../controllers'),
	auth = controllers.auth,
	items = controllers.items,
	feeds = controllers.feeds,
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
	app.get('/auth/info', auth.info);
	// login or link with external auth
	app.get('/auth/:method', auth.auth);
	// handle external auth callback
	app.get('/auth/callback/:method', auth.callback);
	// logout
	app.get('/logout', auth.logout);
	
	
	// ********** routes for items **********
	// create new item
	app.post('/items', requireLogin, requireVerification, items.create);
	// read full item
	app.get('/items/:id', items.read);
	// update existing item
	app.put('/items/:id', requireLogin, requireVerification, items.update);
	// delete item
	app.delete('/items/:id', requireLogin, requireVerification, items.delete);
	
	// ********** routes for lists of items **********
	// read items by feed
	app.get('/items/feed/:id', items.readFeed);
	// read items by feed, at specific page
	app.get('/items/feed/:id/:page', items.readFeed);
	// read items by tag
	app.get('/items/tag/:id', items.readTag);
	// read items by tag, at specific page
	app.get('/items/tag/:id/:page', items.readTag);
	
	// ********** routes for item transactions **********
	// create transaction on item
	app.post('/items/:id/transactions', requireLogin,
		requireVerification, items.getById, items.transactions.create);
	// update transaction on item
	app.put('/items/:id/transactions/:tx', requireLogin,
		requireVerification, items.getById, items.transactions.update);
	// delete transaction on item
	app.delete('/items/:id/transactions/:tx', requireLogin,
		requireVerification, items.getById, items.transactions.delete);
	
	// ********** routes for comments **********
	// create level 1 comment
	app.post('/items/:id/comments', requireLogin, requireVerification,
		items.getById, items.comments.getById, items.comments.create);
	// create level 2+ comment
	app.post('/items/:id/comments/:comment', requireLogin, requireVerification,
		items.getById, items.comments.getById, items.comments.create);
	// update comment
	app.put('/items/:id/comments/:comment', requireLogin, requireVerification,
		items.getById, items.comments.getById, items.comments.update);
	// delete comment
	app.delete('/items/:id/comments/:comment', requireLogin,
		requireVerification, items.getById, items.comments.getById,
		items.comments.delete);
		
	// ********** routes for comment transactions **********
	// create transaction on comment
	app.post('/items/:id/comments/:comment/transactions', requireLogin,
		items.getById, items.comments.getById,
		requireVerification, items.transactions.create);
	// update transaction on comment
	app.put('/items/:id/comments/:comment/transactions/:tx', requireLogin,
		items.getById, items.comments.getById,
		requireVerification, items.transactions.update);
	// delete transaction on comment
	app.delete('/items/:id/comments/:comment/transactions/:tx', requireLogin,
		items.getById, items.comments.getById,
		requireVerification, items.transactions.delete);
	
	// ********** routes for feeds **********
	// create a new feed
	app.post('/feeds', requireLogin, requireVerification, feeds.create);
	// read feed metadata
	app.get('/feeds/:id', feeds.read);
	// update feed metadata
	app.put('/feeds/:id', requireLogin, requireVerification, feeds.update);
	// delete feed
	app.delete('/feeds/:id', requireLogin, requireVerification, feeds.delete);
	
	// ********** routes for users **********'
	// create new user (register)
	app.post('/users', users.create);
	// read user profile
	app.get('/users/:id', users.read);
	// update profile
	app.put('/users/:id', requireLogin, users.update);
	// delete profile
	app.delete('/users/:id', requireLogin, users.delete);
	
	// redirect get requests to hashpath
	app.get('*', function(req, res) {
		res.redirect('/#' + req.path);
	});
	
	// all other requests are no bueno
	app.all('*', function(req, res) {
		res.error(404);
	});
};
