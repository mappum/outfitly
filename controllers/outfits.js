var models = require(__dirname + '/../models'),
	Outfit = models.Outfit,
	ObjectId = require('mongoose').Types.ObjectId,
	config = require(__dirname + '/../config.js');
	
var summary = [
	'_id',
	'caption',
	'image',
	'author',
	'original',
	'date',
	'stats'
];

var outfits = module.exports = {
	'create': function(req, res) {
		new Outfit({
			'caption': req.body.caption,
			'pieces': [],
			'image': req.body.image,

			'private': 'true',
			
			'author': req.session.user.person,
			'date': Date.now()
		}).save(res.mongo);
	},
	
	'read': function(req, res) {
		Outfit.findById(req.param('id'), res.mongo);
	},
	
	'readFeed': function(req, res) {
		// TODO: cache feeds
		var query = Outfit.find(null, summary);

		if(typeof req.session.user !== 'undefined') {
			query
			.or([{'author._id': {$in: req.session.user.following}},
				{'author._id': req.session.userId}]);
		}
		
		query
			.where('private').ne('true')
			.sort('date', -1)
			.limit(Math.min(req.query.limit, 48) || 24)
			.skip(req.query.skip || 0)
			.exec(res.mongo);
	},
	
	'update': function(req, res) {
		var obj = {};

		if(typeof req.body['private'] !== 'undefined') obj['private'] = req.body['private'];
		if(typeof req.body.caption !== 'undefined') obj.caption = req.body.caption;
		if(typeof req.body.image !== 'undefined') obj.image = req.body.image;
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

		console.log(obj);

		Outfit.update({
			'_id': ObjectId(req.param('id')),
			'author._id': req.session.userId
		}, obj, {}, res.mongo);
	},
	
	'delete': function(req, res) {
		Outfit.remove({
			'_id': req.param('id'),
			'author._id': req.session.userId
		}, res.mongo);
	},

	'like': function(req, res) {
		var like = res.doc.likes.id(req.session.userId);

		if(!like) {
			res.doc.likes.push(req.session.user.person);
			res.doc.stats.likes++;
			res.doc.save(res.mongo);
		} else {
			res.error(401);
		}
	},

	'unlike': function(req, res) {
		var like = res.doc.likes.id(req.session.userId);

		if(like) {
			like.remove();
			res.doc.stats.likes--;
			res.doc.save(res.mongo);
		} else {
			res.error(404);
		}
	},

	'repost': function(req, res) {
		new Outfit({
			'author': req.session.user.person,
			'caption': res.doc.caption,
			'image': res.doc.image,
			'pieces': res.doc.pieces,
			'original': res.doc.author
		}).save(res.mongo);

		res.doc.reposts.push(req.session.user.person);
		res.doc.stats.reposts++;
		res.doc.save();
	},
	
	'comments': {
		'create':  function(req, res) {
			res.doc.comments.push({
				'author': req.session.user.person,
				'body': req.body.body || "",
				'date': Date.now()
			});
			res.doc.stats.comments++;
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
				res.doc.stats.comments--;
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
