var Apa = require('apa'),
	config = require(__dirname + '/../config.js'),
	apa = new Apa(config.apa);

var outfits = module.exports = {
	'read': function(req, res) {
		apa.get('ItemSearch', {
			'SearchIndex': 'Apparel',
			'ResponseGroup': 'ItemAttributes,Images',
			'Keywords': req.param('query')
		}, function(err, data) {
			if(err) res.error(500);
			else res.json(data);
		});
	}
};
