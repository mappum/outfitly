var models = require('../models'),
	Item = models.Item,
	Feed = models.Feed,
	ObjectId = require('mongoose').Types.ObjectId,
	config = require('../config.js');
	
var summary = [
	'_id',
	'title',
	'body',
	'author',
	'class',
	'date',
	'tags'
];

var items = module.exports = {
	'create' : function(req, res) {
		if(req.body.title && req.body.body) {
			for(var i = 0; i < req.body.tags.length; i++) {
				req.body.tags[i] = req.body.tags[i].toLowerCase();
			}
						
			new Item({
				'title': req.body.title,
				'body': req.body.body,
				'link': req.body.link,
				'class': req.body['class'],
				
				'tags': req.body.tags,
				
				'author': req.session.userId,
				'date': new Date()
			}).save(res.mongo);
		} else {
			res.error(400);
		}
	},
	
	'read' : function(req, res) {
		Item.findById(req.param('id'), res.mongo);
	},
	
	'update' : function(req, res) {
		Item.update(
			{
				'_id': ObjectId(req.param('id')),
				'author': req.session.userId
			}, {
				'body': req.body.body || ''
			}, {}, res.mongo);
	},
	
	'delete' : function(req, res) {
		// TODO: permissions for deleting
		res.error(401);
	},
	
	/*'readFeed': function(req, res) {
		Feed.findById(req.param('id'), function(err, feed) {
			if(err) {
				res.error(500);
				console.log('db error - ' + err);
			} else if(!feed) {
				res.error(404);
			} else {
				Item.find({tags: {$in: feed.tags}}, summary)
					.sort('date', -1)
					.skip(req.param('page', 0) * config.pageSize)
					.limit(config.pageSize)
					.run(res.mongo);
			}
		});
	},*/
	
	'readTag': function(req, res) {
		Item.find({tags: req.param('id').toLowerCase()}, summary)
			.sort('date', -1)
			.skip(req.param('page', 0) * config.pageSize)
			.limit(config.pageSize)
			.run(res.mongo);
	},
	
	'readFeed': function(req, res) {
		Item.find({tags: req.param('id').toLowerCase()}, summary)
			.sort('date', -1)
			.skip(req.param('page', 0) * config.pageSize)
			.limit(config.pageSize)
			.run(res.mongo);
	},
	
	'transactions': {
		'create': function(req, res) {
			if(res.node.author === req.session.userId) res.error(401);
			else {
				res.node.transactions.push({
					'value': req.body.value,
					'class': req.body['class'],
					'author': req.session.userId,
					'date': new Date(),
				});
				res.doc.save(res.mongo);
			}
		},
		
		'update': function(req, res) {
			var tx = res.node.transactions.id(req.param('tx'));
				
			if(tx.author !== req.session.userId) res.error(401);
			else {
				tx.value = req.body.value;
				res.doc.save(res.mongo);
			}
		},
		
		'delete': function(req, res) {
			var tx = res.node.transactions.id(req.param('tx'));
				
			if(tx.author !== req.session.userId) res.error(401);
			else {
				tx.remove();
				res.doc.save(res.mongo);
			}
		}
	},
	
	'comments': {
		'create':  function(req, res) {
			var parent;
			if(res.doc != res.node) parent = res.node._id;
			
			res.doc.comments.push({
				'_parent': parent,
				'author': req.session.userId,
				'body': req.body.body,
				'date': new Date()
			});
			res.doc.save(res.mongo);
		},
		
		'update':  function(req, res) {
			res.node.body = req.body.body;
			res.doc.save(res.mongo);
		},
		
		'delete': function(req, res) {
			res.node.remove();
			res.doc.save(res.mongo);
		},
		
		'getById': function(req, res, next) {
			var node = res.doc.comments.id(req.param('comment'));
			
			if(!node) res.error(404);
			else {
				res.node = node;
				next();
			}
		}
	},
	
	'getById': function(req, res, next) {
		Item.findById(req.param('id'), function(err, doc) {
			if(err) res.error(500);
			else if(!doc) res.error(404);
			else {
				res.node = res.doc = doc;
				next();
			}
		});
	}
};
