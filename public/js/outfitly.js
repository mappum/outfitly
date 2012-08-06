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
	//TODO: work form logic into torso.js?

	var formSetups = {
		'login': function($el, session) {
			var login = function() {
				if(!$el.find('button').hasClass('disabled')) {
					$el.find('button').addClass('disabled').text('Signing in...');
					session.login($el.find('.user').val(),
						$el.find('.password').val(),
						null,
						function() {
							$el.find('button').removeClass('disabled').text('Sign in');
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
		},

		'register': function($el, session) {
			var register = function() {
				if(!$el.find('button').hasClass('disabled')) {
					$el.find('button').addClass('disabled').text('Signing up...');
					session.register({
							name: $el.find('.name').val(),
							email: $el.find('.email').val(),
							password: $el.find('.password').val()
						},
						null, function(e) {
							$el.find('button').removeClass('disabled').text('Sign up');
							$el.find('label').html('An error occurred.');
						});
				}
			};

			$el.keypress(function(e) {
				if(e.which === 13) {
					register();
					return false;
				}
			});

			$el.find('button').click(register);
		},

		'register-2': function($el, session) {
			var submit = function() {
				if(!$el.find('button').hasClass('disabled')) {
					$el.find('button').addClass('disabled').text('Submitting...');
					$.ajax({
						type: 'PUT',
						url: '/users/' + session.get('userId'),
						data: { username: $el.find('.username').val() },
						success: function() {
							var onLoadUser = function(user) {
								if(typeof user.get('username') !== 'undefined') window.location = '/#/';
								session.off('loaded', onLoadUser);
							};
							session.on('loaded', onLoadUser);

							session.loadUser();
						}
					});
				}
			};

			$el.keypress(function(e) {
				if(e.which === 13) {
					submit();
					return false;
				}
			});

			$el.keyup(function(e) {
				$.ajax({
					url: '/users/exists',
					data: { username: $el.find('.username').val() },
					type: 'PUT',
					error: function(data) {
						$el.find('label').html('');
						$el.find('button').removeClass('disabled');
					},
					success: function(data) {
						$el.find('label').html('That username is not available.');
						$el.find('button').addClass('disabled');
					}
				});
			});

			$el.find('button').click(submit);
		},

		'actions': function($el, options) {
			$el.find('.like').click(function(e) {
				var stats = _.clone(options.model.get('stats'));
				stats.likes++;
				options.model.set('stats', stats);

				$.ajax({
					url: '/outfits/' + options.model.get('_id') + '/likes',
					success: function(e) {
						options.model.fetch();
					}.bind(this),
					type: 'POST'
				});

				e.preventDefault();
				return false;
			}.bind(this));

			$el.find('.repost').click(function(e) {
				var stats = _.clone(options.model.get('stats'));
				stats.reposts++;
				options.model.set('stats', stats);

				$.ajax({
					url: '/outfits/' + options.model.get('_id'),
					success: function(e) {
						options.model.fetch();
					}.bind(this),
					type: 'POST'
				});

				e.preventDefault();
				return false;
			});
		},

		'scroll-up': function($el) {
			$el.click(function() {
				$('html, body').animate({scrollTop: '0'});
			});
		},

		'comment': function($el, options) {
			var comment = function() {
				$.ajax({
					url: '/outfits/' + options.model.get('_id') + '/comments',
					data: {
						body: $el.find('.body').val()
					},
					success: function(e) {
						options.model.fetch();
					}.bind(this),
					type: 'POST'
				});
				$el.find('.body').val('');
			};
			$el.find('button').click(comment);
			$el.keypress(function(e) {
				if(e.which === 13 && !e.shiftKey) {
					comment();
					return false;
				}
			});
		}
	};
	var setupForms = function($el, options) {
		var forms = $el.find('[class^="form-"], [class*=" form-"]');

		forms.each(function(i, el) {
			var $el = $(el);
			for(var form in formSetups) {
				if($el.hasClass('form-' + form)) {
					formSetups[form]($el, options);
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
		collectionPath: '',
		
		url: function() { return '/' + this.collectionPath + '/' + (this.id || ''); }
	});

	var User = Base.extend({
		collectionPath: 'users',
		defaults: {
			_id: '',
			date: Date.now()
		}
	});

	var Outfit = Base.extend({
		collectionPath: 'outfits',
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
			
			$.ajax({
				url: '/auth/info',
				success: function(data) {
					that.set('userId', data._id);
					that.set('user', new User(data));
					that.trigger('loaded', that.get('user'));
					if(!data.username) window.location = '/#/register';
				},
				error: function() {
					that.set('userId', null);
					that.set('user', null);
					that.trigger('loaded', null);
				}
			});
		},
		login: function(user, password, success, error) {
			var that = this;
			$.ajax('/auth', {
				type: 'POST',
				data: { user: user, password: password },
				success: function(data) {
					that.set('userId', data._id);
					that.set('user', new User(data));

					if(typeof data.username !== 'undefined') window.location = '/#/';
					else window.location = '/#/register';
					
					if(success) success(data);
				},
				error: function(data) {
					that.set('userId', null);
					that.set('user', null);
					if(error) error(data);
				}
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
		},

		setup: function() {
			setupForms(this.$el, {model: this.model});
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

		initialize: function(options) {
			_.bindAll(this, 'setup', 'render');
			this.session = options.session;
			this.session.on('change:user', this.render);

			this.render(options);
		},

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
			setupForms(this.$el, {session: this.session, model: this.model});
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
					model: outfit,
					session: this.session
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

			$(window)
				.on('scrollBottom', function(e) {
					this.loadNextPage();
				}.bind(this))

				.on('scrollDown', function(e) {
					this.$el.find('.scroll-up').removeClass('collapsed-horizontal');
				}.bind(this))

				.on('scrollTop', function(e) {
					this.$el.find('.scroll-up').addClass('collapsed-horizontal');
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

	$(function() {
		var scrollBottomLock = false,
			scrollTopLock = false,
			scrollDownLock = false,
			scrollThreshold = 250;

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

			if(target.scrollTop() > scrollThreshold) {
				if(!scrollDownLock) {
					scrollDownLock = true;
					target.trigger('scrollDown', e);
				}
			} else {
				scrollDownLock = false;
			}

			if(target.scrollTop() < scrollThreshold) {
				if(!scrollTopLock) {
					scrollTopLock = true;
					target.trigger('scrollTop', e);
				}
			} else {
				scrollTopLock = false;
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

		var createRouter = function() {
			var router = new Torso.Router({
				app: app,
				routes: {
					"login": "login",
					"register": "register",
					"link/:service": "link",

					"user/:id": "user",
					"@:id": "user",

					"outfit/:id": "outfit",
					
					"/": "front",
					"": "front",

					"*_": "404"
				}
			});
			app.session.off('loaded', createRouter);
		};
		app.session.on('loaded', createRouter);
	});
})();