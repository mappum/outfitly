var MINUTE = 60 * 10000;
var HOUR = MINUTE * 60;
var DAY = HOUR * 24;
var WEEK = DAY * 7;
var MONTH = DAY * 30;
var YEAR = DAY * 365;

var config = {};

// general site metadata
config.meta = {
	host: 'HOST',
	port: 80,
	dataHost: 'DATA_HOST',
	title: 'Outfitly',
	tagline: ''
};

// database settings
config.mongo = {
	user: 'DB_USER',
	password: 'DB_PASSWORD',
	host: 'DB_HOST',
	db: 'DB_NAME'
};
var m = config.mongo;
m.uri = 'mongodb://' + m.user + ':' + m.password + '@' + m.host + '/' + m.db;

// cookie settings
config.cookie = {
	secret: 'SECRET',
	key: 'session',
	maxAge: MONTH
};

// static server settings
config.static = {
	enabled: true,
	path: __dirname + '/public',
	age: WEEK
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

//external service settings
config.externals = {
	'facebook': {
		appId: 'APP_ID',
		appSecret: 'APP_SECRET',
		scope: 'email',
		callback: config.url + '/auth/callback/facebook'
	}
};

// mail settings
config.smtp = {
	host: "SMTP_HOST",
    secureConnection: true,
    port: 465,
	auth: {
		user: 'SMTP_USER',
		pass: 'SMTP_PASSWORD'
	}
};

module.exports = config;