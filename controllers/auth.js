var models = require(__dirname + '/../models'),
	User = models.User,
	crypto = require('crypto');

function getArrayField(array, field) {
	var output = [];
	for(var i = 0; i < array.length; i++) {
		output.push(array[i][field]);
	}
	return output;
}

function checkPassword(user, pass, success, failure) {
	var query = {};
	if(user.indexOf('@') !== -1) query.email = user;
	else query.username = user;

	User.findOne(query, function(err, doc) {
		// error or no user with requested id
		if(err || !doc) failure();
		
		// user is valid
		else {
			// calculate hash of proposed pass + salt
			var hash = crypto.createHash('sha256');
			hash.update(pass);
			hash.update(new Buffer(doc.password.salt, 'hex'));
			
			// calculated hash is equal to stored hash, yay!
			if(hash.digest('hex') === doc.password.hash)
				success(doc);
			// password doesn't match :(
			else failure();
		}
	});
}

function tryAuth(req, res) {
	req.authenticate([req.param('method')], function(err, authenticated) {
		if(err) {
			console.log('auth error - ' + err);
			res.error(500);
		} else {
			if(authenticated) {
				auth.link(req, res);
			}
		}
	});
}

function setUser(user) {
	if(user) {
		this.session.userId = user._id;
		this.session.user = {
			_id: user._id,
			username: user.username,
			name: user.name,
			email: user.email,
			date: user.date,
			description: user.description,
			avatar: user.avatar,
			verified: user.verified,
			complete: user.complete,
			scores: user.scores,
			notifications: user.notifications,

			person: {
				_id: user._id,
				username: user.username,
				name: user.name,
				avatar: user.avatar
			},

			following: getArrayField(user.following, '_id'),
			followers: getArrayField(user.followers, '_id')
		};
	} else {
		this.session.user = undefined;
		this.session.userId = undefined;
		this.session.destroy();
	}
}

var auth = module.exports = {
	// middleware for registering auth functions
	'middleware': function(req, res, next) {
		// set this session's logged in user to a certain User
		req.setUser = setUser.bind(req);
		
		next();
	},
	
	// login with normal POST login
	'login': function(req, res) {
		checkPassword(req.body.user, req.body.password, function(user) {
			// set session to be logged in as this user
			req.setUser(user);
			
			// send user model data to client
			res.json(req.session.user);
			
			// if we linked to an external account while logged out, add it to user object
			if(req.session.link) {
				user.externals.push(req.session.link);
				user.save();
				req.session.link = null;
			}
			
		}, function() {
			res.error(400);
		});
	},
	
	// send auth and callback requests to connect-auth module
	'auth': tryAuth,
	'callback': tryAuth,
	
	'logout': function(req, res) {
		req.setUser(undefined);
		res.redirect('/');
	},
	
	'info': function(req, res) {
		User.findById(req.session.userId, res.mongo);
	},
	
	'checkPassword': checkPassword,
	
	'link': function(req, res) {
		var service = req.param('method').toLowerCase(),
			details = req.getAuthDetails(),
			id = details.user.id || details.user.user_id,
			token = details.access_token || details.twitter_oauth_token;

		console.log(req.getAuthDetails());
			
		// check if a user is linked to this ID
		User.findOne({
			'externals.id': id,
			'externals._id': service
		}, function(err, linked) {
			if(err) {
				console.log('db error - ' + err);
				res.redirect('/#/');
				//TODO: send error to client
			
			// a user is linked to this ID
			} else if(linked) {
				
				// we are already logged in
				if(req.session.userId) {
					
					// we are logged in and already linked
					if(String(linked._id) === req.session.userId) {
						//TODO: send error to client
						
					// we are trying to link to an already linked ID! no bueno!
					} else {
						//TODO: send error to client
					}
					
					res.redirect('/#/');
					
				// we aren't logged in
				} else {
					// set logged in user to this linked account
					req.setUser(linked);
					res.redirect('/#/');
				}
			
			// no user is linked to this ID
			} else {
				
				// we are logged in
				if(req.session.userId) {
					// add ID to current user, but only if we aren't linked to one
					User.findById(req.session.userId, function(err, user) {
						
						// this user is already linked
						if(user.externals.id(service)) {
							//TODO: send error to client
							
						// this user isn't linked
						} else {
							user.externals.push({
								_id: service,
								token: token,
								id: id
							});
							user.save();
							//TODO: send confimation message to client
						}
						
						res.redirect('/#/');
					});
					
				// we aren't logged in
				} else {
					// save linked ID in session, add it on registration/login
					req.session.link = {
						_id: service,
						id: id,
						token: token
					};
					
					// take them to link form, where user can log in or register
					res.redirect('/#/link/' + service);
				}
				
			}
		});
    }
};
