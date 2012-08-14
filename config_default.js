var MINUTE = 60 * 10000;
var HOUR = MINUTE * 60;
var DAY = HOUR * 24;
var WEEK = DAY * 7;
var MONTH = DAY * 30;
var YEAR = DAY * 365;

var config = {};

// general site metadata
var domain = 'localhost'; // your domain
config.meta = {
	domain: domain,
	webHost: domain, // the host we want to get static web files from
	apiHost: domain, // the host we want to request data from

	port: 80, // the port this app is listening on

	title: 'Outfitly',
	tagline: ''
};

// feed settings
config.feed = {
	// whether or not to show users the global feed (show all posts, not only following)
	global: true
};

// database settings
config.mongo = {
	user: '',
	password: '',
	host: 'localhost',
	db: 'outfitly'
};
var m = config.mongo;
config.mongo.uri = 'mongodb://' + m.user + ':' + m.password + '@' + m.host + '/' + m.db;

// redis settings
config.redis = {
	host: '',
	port: 1337,
	db: 'outfitly',
	pass: ''
};

// session settings
config.session = {
	cookie: {
		secret: '',
		key: 'session',
		expires: false
	},
	ignore: [
		'/users/exists',
		'/products'
	]
};

// static server settings
config.static = {
	enabled: true,
	path: __dirname + '/public',
	age: HOUR
};

// ssl settings
config.ssl = {
	key: __dirname + '/ssl/key.pem',
	cert: __dirname + '/ssl/cert.pem'
};

// auth/account settings
config.auth = {
	requireVerification: false
};
a
// external service settings
config.externals = {
	'facebook': {
		appId: '',
		appSecret: '',
		scope: 'email',
		callback: 'http://' + config.meta.apiHost + '/auth/callback/facebook'
	},

	'twitter': {
		consumerKey: '',
		consumerSecret: ''
	}
};

// mail settings
config.mail = {
	enabled: false, // TODO: set up mails
	smtp: {
		host: '',
		secureConnection: true,
		port: 465,
		auth: {
			user: '',
			pass: ''
		}
	}
};

// amazon product advertising API settings
config.apa = {
	id: '',
	secret: '',
	associateId: ''
};

module.exports = config;