var User = require(__dirname + '/../models').User,
	crypto = require('crypto'),
	config = require(__dirname + '/../config.js'),
	mail = require(__dirname + '/../app/mail.js'),
	ObjectId = require('mongoose').ObjectId;

module.exports = {
	'create': function(req, res) {
		if(req.body.password.length < 6) {
			res.error(400);
			return;
		}
		
		var hash = crypto.createHash('sha256');
		var salt = crypto.randomBytes(32).toString('hex');
		hash.update(req.body.password);
		hash.update(salt);
		
		var user = new User({
			'name': req.body.name,
			'username': req.body.username,
			'email': req.body.email,
			'verified': !config.auth.requireVerification,
			
			'password': {
				'hash': hash.digest('hex'),
				'salt': salt
			},
			
			'date': Date.now(),
			'description': '',
			'avatar': ''
		});
		
		// if we saved an external account link while logged out, add it to the new user profile
		if(req.session.link) {
			user.externals.push(req.session.link);
			req.session.link = null;
		}
		
		req.session.regenerate(function(err) {
			if(err) res.error(500);
			else {
				req.setUser(user);
				user.save(res.mongo);
			}
		});
		
		
		//TODO: send welcome mail
		/*mail.send({
			from: 'info@aptt.me',
			to: user.account.email,
			text: '',
			html: ''
		});*/
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
			if(typeof req.param('name') !== 'undefined') obj.name = req.param('name');
			if(typeof req.param('description') !== 'undefined') obj.description = req.param('description');

			User.update({'_id': id}, obj, {}, function(err, doc) {
				if(err || !doc) {
					res.error(500);
					console.log('db error - ' + err);
				} else {
					res.json({ok: 1});
				}
			});
		} else {
			res.error(401);
		}
	},
	
	'delete': function(req, res) {
		//TODO: allow account deletion
		res.error(401);
	}
};