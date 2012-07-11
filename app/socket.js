var Item = require(__dirname + '/../models/schemas/item.js'),
	connect = require('connect'),
	parseCookie = connect.utils.parseCookie,
	Session = connect.middleware.session.Session;
	
var subscriptions = {};

function broadcast(channel, data) {
	if(subscriptions[channel]) {
		for(var i = 0; i < subscriptions[channel].length; i++) {
			subscriptions[channel][i].emit(data);
		}
	}
};
	
module.exports = function(app, sessionStore) {
	var io = require('socket.io').listen(app);
	
	// on connection, check cookies to connect socket to a session
	io.set('authorization', function(data, accept) {
	    if(data.headers.cookie) {
	        data.cookie = parseCookie(data.headers.cookie);
	        data.sessionId = data.cookie['session'];
	        data.sessionStore = sessionStore;
	        
	        sessionStore.get(data.sessionId, function(err, session) {
	        	if(err || !session) {
	        		accept(err);
	        	} else {
	        		data.session = new Session(data, session);
	    			accept(null, true);
	        	}
	        });
	    } else {
	       return accept('No cookie transmitted.');
	    }
	});
	
	// listen for connections
	io.sockets.on('connection', function(socket) {
		var session = socket.handshake.session;
		
		socket.on('subscribe', function(channel) {
			if(!subscriptions[channel]) subscriptions[channel] = [];
			if(subscriptions[channel].indexOf(socket) === -1) subscriptions[channel].push(socket);
		});
		
		socket.on('unsubscribe', function(channel) {
			if(!subscriptions[channel]) subscriptions[channel] = [];
			
			var index = subscriptions[channel].indexOf(socket);
			if(index !== -1) subscriptions[channel].splice(index, 1);
		});
	});
	
	// alert people subscribed to certain tags of new post
	Item.pre('save', function(next) {
		next();
		
		for(var i = 0; i < this.tags.length; i++) {
			var tag = this.tags[i];
			broadcast('#' + tag, this);
		}
	});
};