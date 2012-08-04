var express = require('express'),
	fs = require('fs'),
	auth = require('connect-auth'),
	config = require(__dirname + '/config.js'),
	mongoose = require('mongoose'),
	MongoStore = require('connect-mongo')(express),
	sessionStore = new MongoStore({url: config.mongo.uri});
	
mongoose.connect(config.mongo.uri);

var app = express();

// add body parser POST data
app.use(express.bodyParser());

// add cookie/session support
// TODO: move session store somewhere faster than mongo (redis?)
// TODO: add session ignore paths to requests that can be stateless
app.use(express.cookieParser());
app.use(express.session({
	store: sessionStore,
	secret: config.session.cookie.secret,
	key: config.session.cookie.key,
	maxAge: config.session.cookie.maxAge,
	ignore: config.session.ignore
}));

// development mode specific configuration
app.configure('development', function() {
	// if static server is enabled, serve static files, but don't cache them
	if(config.static.enabled) {
		app.use(express.static(config.static.path, {maxAge: 0}));
	}
	
	// turn on error dumping
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
});

// production mode specific configuration
app.configure('production', function() {
	// if static server is enabled, serve static files
	if(config.static.enabled) {
		//app.use(express.staticCache());
		app.use(express.static(config.static.path, {maxAge: config.static.age}));
	}
	
	// turn off error dumping
	app.use(express.errorHandler());
});

// include config with requests
app.use(function(req, res, next) {
	res.config = config;
	next();
});

require(__dirname + '/app/mongo.js')(app); // set up mongodb middleware
app.use(require(__dirname + '/controllers/auth.js').middleware); // use auth controller middleware
require(__dirname + '/app/auth.js')(app); // set up auth controllers
require(__dirname + '/app/routes.js')(app); // set up routes
//require(__dirname + '/app/socket.js')(app, sessionStore); // handle Socket.IO connections

app.listen(process.env.PORT || config.meta.port);
