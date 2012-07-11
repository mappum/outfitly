function addTooltips() {
	$('.tooltipped').tooltip();
}

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
		
		"feed/:id": "feed",
		"user/:id": "user",
		"tag/:id": "tag",
		"item/:id": "item",
		":id": "feed",
		
		":feed/new": "new",
		
		"/": "front",
		"*id": "front",
	},
	
	initialize: function(options) {
		this.content = options.content;
	},
	
	login: function(){ this.updateContent('login') },
	link: function(service){ this.updateContent('link', service) },
	register: function(){ this.updateContent('register') },
	feed: function(id){ this.updateContent('feed', id) },
	user: function(id){ this.updateContent('user', id) },
	tag: function(id){ this.updateContent('tag', id) },
	item: function(id){ this.updateContent('item', id) },
	'new': function(feed){ this.updateContent('new', feed) },
	front: function(){ this.updateContent('front') },
	
	updateContent: function(page, arg) {
		this.content.page = page;
		this.content.render(arg);
	}
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
		account: {
			date: new Date(),
			name: {
				display: '[deleted]'
			}
		}
	}
});

var Item = Base.extend({
	collection: 'items',
	defaults: {
		'class': 'text',
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
	login: function(email, password, success, error) {
		var that = this;
		$.ajax('/auth', {
			type: 'POST', data: { email: email, password: password }
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

// #### COLLECTIONS ####

var Users = Backbone.Collection.extend({
	model: User
});

// ## VIEWS ##

var Content = Backbone.View.extend({
	templates: {
		login: _.template($('#template-main-login').html()),
		register: _.template($('#template-main-register').html()),
		link: _.template($('#template-main-link').html()),
		'new': _.template($('#template-main-new').html()),
		front: _.template($('#template-main-front').html()),
		feed: _.template($('#template-main-feed').html())
	},
	
	page: 'front',
	
	initialize: function() {
		_.bindAll(this, 'render', 'setSpan', 'login', 'link', 'register', 'new', 'front', 'feed', 'user', 'tag', 'item', '404');
		this.model.on('change:user', function(){ if(this.page === 'front') this.front(); }.bind(this));
	},
	
	render: function(id) {
		this[this.page](id);
		return this;
	},
	
	setSpan: function(n) {
		for(var i = 0; i <= 12; i++) $('#main').removeClass('span' + i);
		$('#main').addClass('span' + n);
		if($('#main').hasClass('span0')) $('#main').css('display', 'none');
		else $('#main').css('display', 'block');
		
		for(var i = 0; i <= 12; i++) $('#secondary').removeClass('span' + i);
		$('#secondary').addClass('span' + (12 - n));
		if($('#secondary').hasClass('span0')) $('#secondary').css('display', 'none');
		else $('#secondary').css('display', 'block');
	},
	
	login: function() {
		this.setSpan(12);
		$('#main').html(this.templates.login());
		
		var $el = $('#main .login'),
			that = this;
			
		function login() {
			if(!$el.find('button').hasClass('disabled')) {
				$el.find('button').addClass('disabled');
				that.model.login($el.find('.email').val(),
					$el.find('.password').val(),
					null,
					function() {
						$el.find('button').removeClass('disabled');
						$el.addClass('error');
						$el.find('label').html('Invalid email or password.');
					});
			}
		}
		
		$el.find('input').keypress(function(e) {
			if(e.which === 13) {
				login();
				return false;
			}
		});
		$el.find('button').click(login);
	},
	
	link: function(service) {
		this.setSpan(12);
		$('#main').html(this.templates.link({service: service}));
		
		var $main = $('#main'),
			$login = $main.find('.login'),
			$register = $main.find('.register'),
			that = this;
			
		function login() {
			if(!$login.find('button').hasClass('disabled')) {
				$login.find('button').addClass('disabled');
				that.model.login($login.find('.email').val(),
					$login.find('.password').val(),
					null, function() {
						console.log('error logging in');
						$login.find('button').removeClass('disabled');
						$login.addClass('error');
						$login.find('label').html('Invalid email or password.');
					});
			}
		}
		function submit() {
			if(!$register.find('button').hasClass('disabled')) {
				$register.find('button')
					.addClass('disabled')
					.text('Sending data...');
					
				that.model.register({
					fname: $register.find('.fname').val(),
					lname: $register.find('.lname').val(),
					email: $register.find('.email').val(),
					password: $register.find('.password').val()
				}, null, function() {
					$register.addClass('error')
						.find('button')
						.removeClass('disabled')
						.text('Sign up');
				});
			}
		}
		
		$login.find('input').keypress(function(e) {
			if(e.which === 13) {
				login();
				return false;
			}
		});
		$login.find('button').click(login);
		
		$register.keypress(function(e) {
			if(e.which === 13) {
				submit();
				return false;
			}
		});
		$register.find('button').click(submit);
	},
	
	register: function() {
		this.setSpan(12);
		$('#main').html(this.templates.register());
		
		var $el = $('#content .register'),
			that = this;
		
		function submit() {
			if(!$el.find('button').hasClass('disabled')) {
				$el.find('button')
					.addClass('disabled')
					.text('Sending data...');
					
				that.model.register({
					fname: $el.find('.fname').val(),
					lname: $el.find('.lname').val(),
					email: $el.find('.email').val(),
					password: $el.find('.password').val()
				}, null, function() {
					$el.addClass('error')
						.find('button')
						.removeClass('disabled')
						.text('Sign up');
				});
			}
		}
		
		$el.find('input').keypress(function(e) {
			if(e.which === 13) {
				submit();
				return false;
			}
		});
		$el.find('button').click(submit);
	},
	
	'new': function(feed) {
		this.setSpan(12);
		$('#main').html(this.templates['new']({feed: feed}));
		
		var $el = $('#main').find('.new'),
			that = this;
			
		function post(e) {
			if(!$el.find('button').hasClass('disabled')) {
				$el.find('button')
					.addClass('disabled')
					.text('Posting...');
				
				var item = new Item({
					title: $el.find('.title').val(),
					body: $el.find('.body').val(),
					class: 'text',
					tags: [$el.find('.feed').val()]
				});
				item.save({}, {
					success: function(data) {
						that.model.get('router').navigate('/#/' + item.get('tags')[0]);
					},
					error: function(data) {
						$el.find('.new').addClass('error');
						$el.find('button')
							.removeClass('disabled')
							.text('Post');
					}
				});
			}
		}
		
		$el.find('.post').click(post);
	},
	
	front: function() {
		this.setSpan(9);
		$('#main').html(this.templates.front(this.model.toJSON()));
	},
	user: function(id) {
		this.setSpan(9);
		console.log('requested user ' + id);
	},
	feed: function(id) {
		this.setSpan(9);
		console.log('requested feed ' + id);
		$('#main').html(this.templates.feed({id: id, loggedIn: this.model.loggedIn()}));
		
		$.get('/items/feed/' + id, function(data) {
			for(var i = 0; i < data.length; i++) {
				var item = new Item(data[i]);
				var summary = new Summary({model: item});
				$('#main .items').append(summary.$el);
			}
		});
	},
	tag: function(id) {
		this.setSpan(9);
		console.log('requested tag ' + id);
	},
	item: function(id) {
		this.setSpan(9);
		console.log('requested item ' + id);
	},
	
	'404': function(id) {
		this.setSpan(12);
		console.log('invalid path');
	}
});

var UserCard = Backbone.View.extend({
	tagName: 'div',
	className: 'user',
	
	template: _.template($('#template-user-card').html()),
	
	initialize: function() {
		_.bindAll(this, 'render');
		this.model.bind('change', this.render);
	},
	
	render: function() {
		this.$el.html(this.template(this.model.attributes));
		return this;
	}
});
var UserMini = Backbone.View.extend({
	tagName: 'div',
	className: 'user user-mini',
	
	template: _.template($('#template-user-mini').html()),
	
	initialize: function() {
		_.bindAll(this, 'render');
		this.model.bind('change', this.render);
	},
	
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
});

var Summary = Backbone.View.extend({
	tagName: 'li',
	className: 'item inset2',
	
	templates: {
		text: _.template($('#template-item-text-summary').html())
	},
	
	initialize: function() {
		_.bindAll(this, 'render', 'updateAuthor');
		
		var author = new User();
		this.userView = new UserMini({model: author});
		
		this.model.bind('change', this.render);
		this.model.bind('change:author', this.updateAuthor);
		
		this.render();
	},
	
	render: function() {
		this.$el.html((this.templates[this.model.get('class')] || this.templates.text)
			(this.model.attributes));
		
		this.$('.meta').append(this.userView.$el);
		this.updateAuthor();
		
		return this;
	},
	
	updateAuthor: function() {
		console.log( this.model.get('author'));
		this.userView.model.set({_id: this.model.get('author')});
		
		this.userView.model.fetch({success: this.userView.render});
	}
});

var Navbar = Backbone.View.extend({
	template: _.template($('#template-navbar-right').html()),
	
	initialize: function() {
		_.bindAll(this, 'render', 'login');	
		this.model.on('change:user', this.render);
	},
	
	render: function() {
		var that = this;
		
		this.$el.html(this.template(this.model.toJSON()));
		
		$('#login button').click(function() {
			that.login();
			return false;
		});
	
		$('#login').keypress(function(e) {
			if(e.which === 13) {
				that.login();
				return false;
			}
		});
		
		$('#login').click(function() {
			return false;
		});
		
		$('body').toggleClass('loggedOut', !this.model.loggedIn());
		
		return this;
	},
	
	login: function() {
		if(!$('#login button').hasClass('disabled')) {
			$('#login button').addClass('disabled');
			
			this.model.login($('#login .email').val(),
				$('#login .password').val(),
				null,
				function() {
					$('#login button').removeClass('disabled');
					$('#login fieldset').addClass('error');
					$('#login label').html('Invalid email or password.');
				});
		}
	}
});

$(function() {
	var session = new Session;
	var navbar = new Navbar({el: $('#navbar-right'), model: session});
	
	var content = new Content({el: $('#content'), model: session});
	var router = new Router({content: content});
	session.set('router', router);
	
	Backbone.history.start();
	
	var users = new Users;
	
	addTooltips();
});
