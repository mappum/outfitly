var User = require(__dirname + '/../models').User,
	crypto = require('crypto'),
	gravatar = require('gravatar'),
	config = require(__dirname + '/../config.js'),
	mail = require(__dirname + '/../app/mail.js');

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
			'account': {
				'name': {
					'first': req.body.fname,
					'last': req.body.lname,
					'display': req.body.fname + ' ' + req.body.lname
				},
				
				'email': req.body.email,
				'verified': !config.requireVerification,
				
				'password': {
					'hash': hash.digest('hex'),
					'salt': salt
				},
				
				'date': new Date(),
				'description': '',
				'avatar': gravatar.url(req.body.email, {s: 128, d: 'mm'})
			}
		});
		
		// if we saved an external account link while logged out, add it to the new user profile
		if(req.session.link) {
			user.externals[req.session.link.service] = req.session.link.id;
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
				'account.name',
				'account.date',
				'account.description',
				'account.avatar',
				'scores'
			],
			res.mongo);
	},
	
	'update': function(req, res) {
		var id = req.param('id');
		if(id === req.session.userId) {
			User.update({'_id': id}, {
					'name': req.param('name'),
					'email': req.param('email'),
					'description': req.param('description')
				}, {}, function(err, doc) {
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