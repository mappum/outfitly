var models = require(__dirname + '/../models'),
	User = models.User,
	Code = models.Code,
	crypto = require('crypto'),
	gravatar = require('gravatar'),
	config = require(__dirname + '/../config.js'),
	mail = require(__dirname + '/../app/mail.js'),
	ObjectId = require('mongoose').ObjectId;

module.exports = {
	'create': function(req, res) {
		var createUser = function(err, code) {
			console.log(code)

			if(err || !code) {
				res.error(401);
				return;
			}

			if(req.body.password.length < 6) {
				res.error(400);
				return;
			}
			
			var hash = crypto.createHash('sha256');
			var salt = crypto.randomBytes(32);
			hash.update(req.body.password);
			hash.update(salt);
			
			var user = new User({
				'name': req.body.name,
				'email': req.body.email,
				'verified': !config.auth.requireVerification,
				
				'password': {
					'hash': hash.digest('hex'),
					'salt': salt.toString('hex')
				},
				
				'date': Date.now(),
				'description': '',

				'avatar': gravatar.url(req.body.email, {s: 200, d: 'mm'})
			});
			
			req.session.regenerate(function(err) {
				if(err) res.error(500);
				else {
					req.setUser(user);
			
					// if we saved an external account link while logged out, add it to the new user profile
					if(req.session.link) {
						user.externals.push(req.session.link);
						req.session.link = null;
					}

					if(config.auth.requireCode) {
						code.used = true;
						code.save();
					}

					user.save(res.mongo);
				}
			});
			
			//TODO: send welcome mail
			/*mail.send({
				from: 'info@outfitly.com',
				to: user.account.email,
				text: '',
				html: ''
			});*/
		};

		if(config.auth.requireCode) Code.findOne({
			'_id': req.body.code.toLowerCase().replace(/[^\w]/gi, '') || '',
			'used': false}, createUser);
		else createUser(null, true);
	},
	
	'read': function(req, res) {
		User.findById(req.param('id'),
			[
				'_id',
				'username',
				'name',
				'date',
				'description',
				'avatar',
				'stats',
				'followers',
				'following'
			],
			res.mongo);
	},
	
	'update': function(req, res) {
		var id = req.param('id');

		if(id === req.session.userId) {
			var obj = {};
			if(typeof req.session.user.username === 'undefined' &&
				typeof req.param('username') !== 'undefined') {
				obj.username = req.param('username');
			}
			if(typeof req.param('name') !== 'undefined') obj.name = req.param('name');
			if(typeof req.param('description') !== 'undefined') obj.description = req.param('description');

			User.update({'_id': id}, obj, function(err, doc) {
				if(err || !doc) {
					res.error(500);
					console.log('db error - ' + err);
				} else {
					res.json({ok: 1});

					if(typeof obj.username !== 'undefined') {
						req.session.user.username = obj.username;
						req.session.user.person.username = obj.username;
						req.session.user.complete = true;
						req.session.save(function(err) {
							console.log('saving session.', err);
						});

						User.update({'_id': id}, {'complete': true}, function(){});
					}
				}
			});
		} else {
			res.error(401);
		}
	},
	
	'delete': function(req, res) {
		//TODO: allow account deletion
		res.error(401);
	},

	'usernameAvailable': function(req, res) {
		User.findOne({ username: req.param('username') }, {'_id': 1}, res.mongo);
	}
};