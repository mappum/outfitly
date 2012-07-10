var util = require('util'),
	Apac = require('apac').OperationHelper;

var apac = new Apac({
	awsId: 'AKIAJMXYB5ST6KU642RA',
	awsSecret: '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',
	assocId: 'outfitly-20'
});

apac.execute('ItemSearch', {
	'SearchIndex': 'Apparel',
	'ResponseGroup': 'ItemAttributes,Images',
	'Keywords': process.argv[2]
}, function(err, data) {
	if(err) {
		console.log('error: ' + err);
	} else {
		var items = data.Items.Item;
		for(var i = 0; i < items.length; i++) {
			console.log(items[i].ItemAttributes.Title);
			console.log(items[i].LargeImage.URL);
			console.log();
		}
	}
});

