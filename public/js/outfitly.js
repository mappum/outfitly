function since(date) {
	return moment.duration(
		moment(date).diff(Date.now())
	).humanize();
}

function following(user) {
	return Math.random() <= 0.5;
}

function truncate(string, length) {
	if(string.length < length) return string;

	var output = string.substr(0, length - 3);
	output = output.substr(0, output.lastIndexOf(' '));
	return output + '...';
}

(function(){
	// #### FORM LOGIC ####
	//TODO: work form logic into torso.js

	var formSetups = {
		'login': function($el, session) {
			var login = function() {
				if(!$el.find('button').hasClass('disabled')) {
					$el.find('button').addClass('disabled');
					session.login($el.find('.user').val(),
						$el.find('.password').val(),
						null,
						function() {
							$el.find('button').removeClass('disabled');
							$el.find('label').html('Invalid login or password.');
						});
				}
			};

			$el.keypress(function(e) {
				if(e.which === 13) {
					login();
					return false;
				}
			});

			$el.find('button').click(login);
		}
	};
	var setupForms = function($el, session) {
		var forms = $el.find('.form');

		forms.each(function(i, el) {
			var $el = $(el);
			for(var form in formSetups) {
				if($el.hasClass(form)) {
					formSetups[form]($el, session);
				}
			}
		});
	};

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
			date: Date.now()
		}
	});

	var Outfit = Base.extend({
		collection: 'outfits',
		defaults: {
			caption: ''
		}
	});

	var Session = Backbone.Model.extend({
		initialize: function(options) {
			_.bindAll(this, 'loggedIn', 'loadUser', 'login', 'register', 'toJSON');

			this.loadUser();
		},
		loggedIn: function() {
			return Boolean(this.get('userId'));
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

	var OutfitCollection = Backbone.Collection.extend({
		model: Outfit,
		url: '/outfits'
	});

	// #### VIEWS ####

	var OutfitSummaryView = Torso.View.extend({
		tagName: 'li',
		className: 'box outfit summary hover-parent',
		template: _.template($('#template-outfit-summary').html()),

		initialize: function() {
			_.bindAll(this, 'setup', 'render');
			this.model.on('change', this.render);
			this.render();
		}
	});

	var UserSummaryView = Torso.View.extend({
		tagName: 'li',
		className: 'box user summary hover-parent span4',
		template: _.template($('#template-user-summary').html()),

		initialize: function() {
			_.bindAll(this, 'setup', 'render');
			this.model.on('change', this.render);
			this.render();
		}
	});

	// #### SCREENS #####

	var LoginScreen = Torso.Screen.extend({
		className: 'box span5 centered',
		template: _.template($('#template-login').html()),

		initialize: function(options) {
			_.bindAll(this, 'setup', 'render');
			this.session = options.session;

			this.render(options);
		},

		setup: function() {
			setupForms(this.$el, this.session);
		}
	});

	var NavbarScreen = Torso.Screen.extend({
		className: 'container-fluid',
		template: _.template($('#template-navbar').html()),
		
		initialize: function(options) {
			_.bindAll(this, 'setup', 'render');
			this.session = options.session;
			this.session.on('change:user', this.render);

			this.render(options);
		},
		
		setup: function() {
			this.$el.find('.login').click(function() {
				return false;
			});

			setupForms(this.$el, this.session);
			
			return this;
		}
	});

	var RegisterScreen = Torso.Screen.extend({
		className: 'box span6 centered',
		template: _.template($('#template-register').html()),

		setup: function() {
			setupForms(this.$el, this.session);
		}
	});

	var LinkScreen = Torso.Screen.extend({
		className: 'box span6 centered',
		template: _.template($('#template-link').html()),

		setup: function() {
			setupForms(this.$el, this.session);
		}
	});

	var OutfitScreen = Torso.Screen.extend({
		className: 'box centered outfit span6',
		template: _.template($('#template-outfit').html()),
		modal: true,

		initialize: function(options) {
			_.bindAll(this, 'setup', 'render');
			this.session = options.session;

			this.model = new Outfit({'_id': options.args[0]});
			this.model.bind('change', this.render);
			this.model.fetch();
		},

		setup: function() {
			setupForms(this.$el, this.session);
		}
	});

	var FrontScreen = Torso.Screen.extend({
		className: '',
		template: _.template($('#template-front').html()),

		initialize: function(options) {
			_.bindAll(this, 'setup', 'render', 'loadNextPage');
			this.session = options.session;

			this.page = -1;
			this.pageSize = 24;
			this.initialized = false;

			this.collection = new OutfitCollection();

			this.loadNextPage();
		},

		render: function() {
			if(!this.initialized) {
				this.$el.html(this.template());
			}

			this.collection.each(function(outfit, i) {
				if(i < this.page * this.pageSize) return;

				var view = new OutfitSummaryView({
					model: outfit
				});
				this.$el.find('.outfits').append(view.$el);
			}.bind(this));

			this.$el.find('div.more')
				.removeClass('loading')
				.find('span')
				.html('Load more posts');

			if(!this.initialized) {
				this.initialized = true;
				this.setup();
			}
		},

		setup: function() {
			setupForms(this.$el, this.session);

			$(window).on('scrollBottom', function(e) {
				this.loadNextPage();
			}.bind(this));

			var more = this.$el.find('div.more');
			more.click(function(e) {
				if(!more.hasClass('loading')) this.loadNextPage();
			}.bind(this));
		},

		loadNextPage: function() {
			this.page++;
			this.collection.fetch({
				add: true,
				success: this.render,
				data: {limit: this.pageSize, skip: this.page * this.pageSize}
			});

			this.$el.find('div.more')
				.addClass('loading')
				.find('span')
				.html('Loading more posts...');
		}
	});

	var TestScreen = Torso.Screen.extend({
		className: '',
		template: _.template($('#template-test').html()),

		setup: function() {
			setupForms(this.$el, this.session);

			//users
			var user = new User({
				name: 'Matt Bell',
				username: 'mappum',
				email: 'mappum@gmail.com',

				verified: true,

				date: new Date(1993, 5, 16),
				description: 'I\'m a web developer that makes cool websites about stuff. :D',
				from: 'Seattle, WA',
				avatar: 'http://placehold.it/256x256',

				stats: {
					posts: 5,
					likes: 26,
					reposts: 2,
					followers: 1337,
					following: 100
				}
			});
			for(var i = 0; i < 24; i++) {
				var summaryView = new UserSummaryView({
					model: user
				});
				this.$el.find('.users').append(summaryView.$el);
			}

			// outfits
			var date = Date.now();
			for(var i = 0; i < 24; i++) {
				var outfit = new Outfit({
					caption: 'Hello, world',

					original: Math.random() < 0.15 ? {
						id: 0,
						username: 'someone',
						name: 'Someone Else'
					} : undefined,

					date: date -= Math.random() * 400000,

					stats: {
						likes: Math.floor(Math.random() * 5),
						comments: Math.floor(Math.random() * 3),
						reposts: Math.floor(Math.random() * 2)
					},

					author: {
						name: 'Matt Bell',
						username: 'mappum',
						avatar: 'http://placehold.it/256x256'
					}
				});

				var summaryView = new OutfitSummaryView({
					model: outfit
				});
				this.$el.find('.outfits').append(summaryView.$el);
			}
		}
	});

	$(function() {
		var scrollBottomLock = false;
		$(window).scroll(function(e) {
			var target = $(window);

			if(target.scrollTop() + target.innerHeight() + 100 > e.target.height) {
				if(!scrollBottomLock) {
					scrollBottomLock = true;
					target.trigger('scrollBottom', e);
				}
			} else {
				scrollBottomLock = false;
			}
		});

		var app = new Torso.App({
			session: new Session(),
			containers: {
				navbar: $('#navbar'),
				main: $('#main'),
				modal: $('#overlay')
			},
			screens: {
				'login': LoginScreen,
				'register': RegisterScreen,
				'link': LinkScreen,
				'outfit': OutfitScreen,
				'test': TestScreen,
				'front': FrontScreen
			},
			defaults: {
				navbar: NavbarScreen
			}
		});

		app.on('display:modal', function(e) {
			$('#main').css('position', 'fixed');

			$('#overlay').click(function(e) {
				if(e.target == document.getElementById('overlay')) window.history.back();
			});
		});

		app.on('display:main', function(e) {
			$('#main').css('position', 'static');
		});

		var router = new Torso.Router({
			app: app,
			routes: {
				"login": "login",
				"register": "register",
				"link/:service": "link",
				
				"setup": "setup",

				"test": "test",

				"user/:id": "user",
				"@:id": "user",

				"outfit/:id": "outfit",
				
				"/": "front",
				"": "front",

				"*_": "404"
			}
		});
	});
})();