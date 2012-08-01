var models = require(__dirname + '/../models'),
	Outfit = models.Outfit,
	ObjectId = require('mongoose').Types.ObjectId,
	config = require(__dirname + '/../config.js');
	
var summary = [
	'_id',
	'caption',
	'pieces',
	'author',
	'date',
	'stats'
];

var outfits = module.exports = {
	'create' : function(req, res) {
		new Outfit({
			'caption': req.body.caption,
			'pieces': [],
			'images': req.body.images ? req.body.images.split('@') : [],
			
			'author': req.session.userId,
			'date': Date.now()
		}).save(res.mongo);
	},
	
	'read' : function(req, res) {
		Outfit.findById(req.param('id'), res.mongo);
	},
	
	'update' : function(req, res) {
		var obj = {};

		if(typeof req.body.caption !== 'undefined') obj.caption = req.body.caption;
		if(typeof req.body.images !== 'undefined') obj.images = req.body.images.split('@');
		if(typeof req.body.pieces !== 'undefined') {
			obj.pieces = req.body.pieces.split('@');
			for(var i = 0; i < obj.pieces; i++) {
				if(obj.pieces[i]) {
					obj.pieces[i] = obj.pieces[i].split('#');
					obj.pieces[i] = {
						url: obj.pieces[0],
						image: obj.pieces[1],
						title: obj.pieces[2],
						brand: obj.pieces[3]
					};
				}
			}
		}

		Outfit.update({
			'_id': ObjectId(req.param('id')),
			'author': req.session.userId
		}, obj, {}, res.mongo);
	},
	
	'delete' : function(req, res) {
		Outfit.remove({
			'_id': req.param('id'),
			'author': req.session.userId
		}, res.mongo);
	},
	
	'comments': {
		'create':  function(req, res) {
			res.doc.comments.push({
				'author': {
					'id': req.session.userId,
					'username': req.session.user.username,
					'name': req.session.user.name,
					'avatar': req.session.user.avatar
				},
				'body': req.body.body || "",
				'date': Date.now()
			});
			res.doc.save(res.mongo);
		},

		'update':  function(req, res) {
			if(res.comment.author === req.session.userId) {
				res.comment.body = req.body.body;
				res.doc.save(res.mongo);
			} else {
				res.error(401);
			}
		},
		
		'delete': function(req, res) {
			if(res.comment.author === req.session.userId) {
				res.comment.remove();
				res.doc.save(res.mongo);
			} else {
				res.error(401);
			}
		},
		
		'getById': function(req, res, next) {
			var node = res.doc.comments.id(req.param('comment'));
			
			if(!node) res.error(404);
			else {
				res.comment = node;
				next();
			}
		}
	},
	
	'getById': function(req, res, next) {
		Outfit.findById(req.param('id'), function(err, doc) {
			if(err) res.error(500);
			else if(!doc) res.error(404);
			else {
				res.doc = doc;
				next();
			}
		});
	}
};
