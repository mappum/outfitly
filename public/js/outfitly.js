(function(){
	function since(date) {
		return moment.duration(
			moment(date).diff(Date.now())
		).humanize();
	}

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

	// #### VIEWS ####

	var OutfitSummaryView = Torso.View.extend({
		className: 'box outfit',
		template: _.template($('#template-outfit-summary').html()),

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

	var TestScreen = Torso.Screen.extend({
		className: '',
		template: _.template($('#template-test').html()),

		setup: function() {
			setupForms(this.$el, this.session);

			var outfit = new Outfit({
				caption: 'Hello, world'
			});
			var summaryView = new OutfitSummaryView({
				model: outfit
			});
			this.$el.append(summaryView.$el);
		}
	});

	$(function() {
		var app = new Torso.App({
			session: new Session(),
			containers: {
				navbar: $('#navbar'),
				main: $('#main')
			},
			screens: {
				'login': LoginScreen,
				'register': RegisterScreen,
				'link': LinkScreen,
				'test': TestScreen,

				'front': LoginScreen // TODO: switch to FrontScreen
			},
			defaults: {
				navbar: NavbarScreen
			}
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
				"outfit/:id": "outfit",
				
				"/": "front",
				"": "front",

				"*_": "404"
			}
		});
	});
})();