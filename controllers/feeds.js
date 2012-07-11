var Feed = require('../models').Feed;

module.exports = {
	'create': function(req, res) {
		new Feed({
			'_id': req.body._id,
			'tags': req.body.tags,
			
			'meta': {
				'date': new Date(),
				'icon': req.body.icon,
				'description': req.body.description,
				
				'creator': req.session.userId,
				'admins': [req.session.userId],
			}
		}).save(res.mongo);
	},
	
	'read': function(req, res) {
		Feed.findById(req.param('id'), res.mongo);
	},
	
	'update': function(req, res) {
		Feed.update(
			{'_id': req.param('id'), 'admins': req.session.userId}, {
				'tags': req.body.tags,
				
				'meta': {
					'icon': req.body.icon,
					'description': req.body.description
				}
			}, {}, res.mongo);
	},
	
	'delete': function(req, res) {
		// TODO: permissions for deleting
		res.error(401);
	}
};