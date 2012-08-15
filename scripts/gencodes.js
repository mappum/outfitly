var mongoose = require('mongoose'),
	Code = require(__dirname + '/../models').Code,
	config = require(__dirname + '/../config.js'),
	commander = require('commander');

mongoose.connect(config.mongo.uri);

commander
	.usage('[options]')
	.option('-g, --generator <type>', 'The code generator, "random" or "range"')
	.option('-n --codes <n>', 'The number of codes to generate', parseInt)
	.option('-d --distributed', 'Whether or not to mark the codes as "distributed"',
		function() { return true; })
	.option('-s, --string <string>', 'Required by "range", the output string (replaces "%i" with i)')
	.option('-o, --offset <offset>', 'Used by "range", the offset to use for i', parseInt)
	.parse(process.argv);

var generators = {
	'random': function() {
		var crypto = require('crypto');
		var data = crypto.randomBytes(12);
		var string = '';

		for(var i = 0; i < data.length; i++) {
			string += data.readUInt8(i).toString(36);
		}

		return string;
	},

	'range': function(i) {
		if(commander.string) {
			return commander.string.replace(/%i/gi, (i + (commander.offset || 0)) + '');
		}
	}
};

var generate = generators[commander.generator || 'random'];
for(var i = 0; i < commander.codes || 0; i++) {
	var string = generate(i);
	if(string) {
		new Code({
			'_id': string,
			'used': false,
			'distributed': Boolean(commander.distributed) || false
		}).save();
		console.log(i + ':', string);
	}
}
setTimeout(process.exit, 2000);