function since(date) {
	return moment.duration(
		moment(date).diff(Date.now())
	).humanize();
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

				var likes = _.clone(options.model.get('likes'));
				likes.push(options.session.get('user').get('person'));

				options.model.set({'stats': stats, 'likes': likes});

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

			$el.find('.unlike').click(function(e) {
				var stats = _.clone(options.model.get('stats'));
				stats.likes--;

				var likes = _.reject(_.clone(options.model.get('likes')),
					function(like) { return like._id === options.session.get('userId'); }
				);
				
				options.model.set({'stats': stats, 'likes': likes});


				$.ajax({
					url: '/outfits/' + options.model.get('_id') + '/likes',
					success: function(e) {
						options.model.fetch();
					}.bind(this),
					type: 'DELETE'
				});

				e.preventDefault();
				return false;
			}.bind(this));

			$el.find('.repost').click(function(e) {
				var stats = _.clone(options.model.get('stats'));
				stats.reposts++;

				var reposts = _.clone(options.model.get('reposts'));
				reposts.push(options.session.get('user').get('person'));

				options.model.set({'stats': stats, 'reposts': reposts});

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
				$('html, body').animate({scrollTop: '0'}, 800);
			});
		},

		'comment': function($el, options) {
			var comment = function() {
				var body = $el.find('.body').val();
				if(body.length > 0) {
					var comments = _.clone(options.model.get('comments'));
					comments.push({
						author: options.session.get('user').get('person'),
						date: Date.now(),
						body: body
					});
					options.model.set('comments', comments);

					$.ajax({
						url: '/outfits/' + options.model.get('_id') + '/comments',
						data: {
							body: body
						},
						success: function(e) {
							options.model.fetch();
						}.bind(this),
						type: 'POST'
					});
					$el.find('.body').val('');
				}
			};
			$el.find('button').click(comment);
			$el.keypress(function(e) {
				if(e.which === 13 && !e.shiftKey) {
					comment();
					return false;
				}
			});
		},

		'post': function($el, options) {
			$el.find('button.next').click(function() {
				if(!$(this).hasClass('disabled')) {
					$(this).addClass('disabled');
					options.view.forward();
				}
			});

			$el.find('button.back').click(function() {
				if(!$(this).hasClass('disabled')) {
					$(this).addClass('disabled');
					options.view.back();
				}
			});

			$el.find('button.submit').click(function() {
				if(!$(this).hasClass('disabled')) {
					$(this).addClass('disabled').text('Posting outfit...');

					options.model.save(null, {success: function() {
						window.location = '/#/';
					}});
				}
			});
		},

		'post-0': function($el, options) {
			setTimeout(function(){
				filepicker.getFile('image/*', {
					'multiple': false,
					'container': 'filepicker-iframe',
					'services': [
						filepicker.SERVICES.COMPUTER,
						filepicker.SERVICES.WEBCAM,
						filepicker.SERVICES.FACEBOOK,
						filepicker.SERVICES.INSTAGRAM
					],
					'persist': true
				}, function(response){
					options.model.set('image', response);
					$el.find('button.next').removeClass('disabled');
				});
			}, 0);

			$el.find('button.reset').click(function() {
				options.model.set('image', null);
				options.view.render();
			});
		},

		'post-1': function($el, options) {
			$el.find('button.next, button.back').click(function() {
				options.model.set('caption', $el.find('textarea').val());
			});

			var next = $el.find('button.next');

			$el.find('textarea').keyup(function(e) {
				if($(this).val().length > 0) next.removeClass('disabled');
				else next.addClass('disabled');
			});
		},

		'post-2': function($el, options) {

		}
	};
	var setupForms = function($el, options) {
		var forms = $el.find('[class^="form-"], [class*="form-"]');

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
		},

		likedBy: function(id) {
			var likes = this.get('likes');
			return !likes.every(function(like) {
				if(like._id === id) return false;
				return true;
			});
		},

		repostedBy: function(id) {
			var reposts = this.get('reposts');
			return !reposts.every(function(repost) {
				if(repost._id === id) return false;
				return true;
			});
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
					data.person = {
						_id: data._id,
						name: data.name,
						username: data.username,
						avatar: data.avatar
					};
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
					data.person = {
						_id: data._id,
						name: data.name,
						username: data.username,
						avatar: data.avatar
					};

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
					data.person = {
						_id: data._id,
						name: data.name,
						username: data.username,
						avatar: data.avatar
					};
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

		initialize: function(options) {
			_.bindAll(this, 'setup', 'render');
			this.model.on('change', this.render);
			this.session = options.session;
			this.render();
		},

		setup: function() {
			setupForms(this.$el, {model: this.model, session: this.session});
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

			this.$el.find('[rel="tooltip"]').tooltip();
		}
	});

	var FeedScreen = Torso.Screen.extend({
		className: '',
		template: _.template($('#template-feed').html()),

		initialize: function(options) {
			_.bindAll(this, 'setup', 'render', 'loadNextPage');
			this.session = options.session;

			this.page = -1;
			this.pageSize = 12;
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

	var PostScreen = Torso.Screen.extend({
		className: 'box centered span10 post',
		template: _.template($('#template-post').html()),

		initialize: function(options) {
			_.bindAll(this, 'setup', 'render', 'back', 'forward');
			this.session = options.session;

			this.page = -1;

			this.model = new Outfit({
				author: this.session.get('user').get('person')
			});

			this.forward();
		},

		setup: function() {
			setupForms(this.$el, {session: this.session, model: this.model, view: this});
		},

		back: function() {
			this.page--;
			this.render();
		},

		forward: function() {
			this.page++;
			this.render();
		}
	});

	$(function() {
		filepicker.setKey('A6D_8Iy0zQe2YTFBlSOA5z');

		var scrollBottomLock = false,
			scrollTopLock = false,
			scrollDownLock = false,
			scrollThreshold = 250;

		$(window).scroll(function(e) {
			var target = $(window);

			if(target.scrollTop() + target.innerHeight() + 200 > e.target.height) {
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
				'feed': FeedScreen,
				'post': PostScreen
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

			$(window).keydown(function(e) {
				if(e.which === 27) window.history.back();
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
					
					"/": "feed",
					"": "feed",

					"post": "post",

					"*_": "404"
				}
			});
			app.session.off('loaded', createRouter);
		};
		app.session.on('loaded', createRouter);
	});
})();