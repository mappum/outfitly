function since(date) {
	return moment.duration(
		moment(date).diff(Date.now())
	).humanize();
}

var Router = Backbone.Router.extend({
	routes: {
		"login": "login",
		"link/:service": "link",
		"register": "register",
		
		"user/:id": "user",
		"outfit/:id": "outfit",
		
		"/": "front",
		"*id": "front",
	},
	
	initialize: function(options) {
		this.appView = options.appView;
	},
	
	login: function() {},
	link: function(service) {},
	register: function() {},
	user: function(id) {},
	outfit: function(id) {},
	front: function() {}
});

// #### MODELS ####

var Base = Backbone.Model.extend({
	initialize: function() {
		_.bindAll(this, 'url');
	},
	
	idAttribute: '_id',
	collection: '',
	
	url: function() { return '/' + this.collection + '/' + (this.id || ''); }
});

var User = Base.extend({
	collection: 'users',
	defaults: {
		_id: '',
		date: Date.now(),
		name: '[deleted]'
	}
});

var Outfit = Base.extend({
	collection: 'outfits',
	defaults: {
		'title': 'untitled',
		'body': ''
	}
});

var Session = Backbone.Model.extend({
	initialize: function() {
		_.bindAll(this, 'loggedIn', 'loadUser', 'login', 'register', 'toJSON');
		
		this.loadUser();
	},
	loggedIn: function() {
		return this.get('userId') != null;
	},
	loadUser: function() {
		var that = this;
		
		$.ajax('/auth/info')
			.done(function(data) {
				if(data._id) {
					that.set('userId', data._id);
					that.set('user', new User(data));
				} else {
					that.set('userId', null);
					that.set('user', null);
				}
			});
	},
	login: function(user, password, success, error) {
		var that = this;
		$.ajax('/auth', {
			type: 'POST', data: { user: user, password: password }
		})
			.success(function(data) {
				that.set('userId', data._id);
				that.set('user', new User(data));
				if(success) success(data);
				that.get('router').navigate('/#/');
			})
			.error(function(data) {
				that.set('userId', null);
				if(error) error(data);
			});
	},
	register: function(data, success, error) {
		var that = this;
		$.ajax('/users', {
			type: 'POST',
			data: data
		})
			.success(function(data) {
				that.set('userId', data._id);
				that.set('user', new User(data));
				if(success) success(data);
				that.get('router').navigate('/#/');
			})
			.error(function(data) {
				//TODO: show error
				if(error) error(data);
			});
	},
	toJSON: function() {
		var obj = _.clone(this.attributes);
		obj.loggedIn = this.loggedIn;
		if(obj.user) obj.user = obj.user.toJSON();
		return obj;
	}
});

// ## VIEWS ##

var LoginScreenView = Backbone.View.extend({
	tagName: 'div',
	className: 'box span5 centered',
	template: _.template($('#template-login').html()),

	initialize: function(options) {
		_.bindAll(this, 'render', 'login');
	},

	render: function() {
		this.$el.html(this.template());
	
		var login = this.$el.find('.login'),
			that = this;
		
		login.keypress(function(e) {
			console.log(e);
			if(e.which === 13) {
				that.login();
				return false;
			}
		});

		login.find('button').click(this.login);
	},

	login: function() {
		var login = this.$el.find('.login'),
			that = this;

		if(!login.find('button').hasClass('disabled')) {
			login.find('button').addClass('disabled');
			this.model.login(login.find('.user').val(),
				login.find('.password').val(),
				null,
				function() {
					login.find('button').removeClass('disabled');
					login.addClass('error');
					login.find('label').html('Invalid login or password.');
				});
		}
	}
});

var NavbarView = Backbone.View.extend({
	tagName: 'div',
	className: 'container-fluid',
	template: _.template($('#template-navbar').html()),
	
	initialize: function() {
		_.bindAll(this, 'render', 'login');	
		this.model.on('change:user', this.render);
	},
	
	render: function() {
		var that = this;
		
		this.$el.html(this.template(this.model.toJSON()));

		var login = this.$el.find('.login');
		
		login.find('button').click(function() {
			that.login();
			return false;
		});
	
		login.keypress(function(e) {
			if(e.which === 13) {
				that.login();
				return false;
			}
		});
		
		login.click(function() {
			return false;
		});
		
		return this;
	},
	
	login: function() {
		var login = this.$el.find('.login');

		if(!login.find('button').hasClass('disabled')) {
			login.find('button').addClass('disabled');
			
			this.model.login(login.find('.user').val(),
				login.find('.password').val(),
				null,
				function() {
					login.find('button').removeClass('disabled');
					login.find('fieldset').addClass('error');
					login.find('label').html('Invalid login or password.');
				});
		}
	}
});

var AppView = Backbone.View.extend({
	initialize: function(options) {
		this.session = new Session;

		this.navbarEl = options.navbar;
		this.mainEl = options.main;
		this.modalEl = options.modal;

		this.navbar = new NavbarView({model: this.session});
		this.navbar.render();
		this.navbarEl.append(this.navbar.$el);

		this.main = new LoginScreenView({model: this.session});
		this.main.render();
		this.mainEl.append(this.main.$el);
	}
});

$(function() {
	var app = new AppView({
		navbar: $('#navbar'),
		main: $('#main'),
		modal: $('#modal')
	});

	var router = new Router({app: app});
	
	Backbone.history.start();
});
