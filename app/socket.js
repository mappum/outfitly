var connect = require('connect'),
	parseCookie = connect.utils.parseCookie,
	Session = connect.middleware.session.Session;
	
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
	});
};