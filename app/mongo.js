module.exports = function(app) {
	// add JSON error response
	app.use(function(req, res, next) {
		res.error = function(code) {
			res.json({'error': code}, code);
		};
		next();
	});
	
	// add mongo callback JSON response
	app.use(function(req, res, next) {
		res.mongo = function(err, docs) {
			if(err) {
				res.error(500);
				console.log('db error - ' + err);
			} else if(!docs) {
				res.error(404);
			} else {
				res.json(docs);
			}
		};
		next();
	});
};