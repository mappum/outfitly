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

Backbone._sync = Backbone.sync;
Backbone.sync = function(method, model, options) {
	options = options || {};
	options.xhrFields = { withCredentials: true };
	return Backbone._sync(method, model, options);
};

var apiDomain = '';//api.outfitly.com';

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
						}, function() {
							window.location = '/#/register';
						}, function(e) {
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
						url: apiDomain + '/users/' + session.get('userId'),
						data: { username: $el.find('.username').val() },
						success: function() {
							var onLoadUser = function(user) {
								if(typeof user.get('username') !== 'undefined') window.location = '';
								session.off('loaded', onLoadUser);
							};
							session.on('loaded', onLoadUser);

							session.loadUser();
						},
						xhrFields: { withCredentials: true }
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
					url: apiDomain + '/users/exists',
					data: { username: $el.find('.username').val() },
					type: 'PUT',
					xhrFields: { withCredentials: true },
					error: function(data) {
						$el.find('label').html('');
						$el.find('button').removeClass('disabled');
					},
					success: function(data) {
						$el.find('label').html('That username is not available.');
						$el.find('button').addClass('disabled');
					},
					xhrFields: { withCredentials: true }
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
					url: apiDomain + '/outfits/' + options.model.get('_id') + '/likes',
					success: function(e) {
						options.model.fetch();
					}.bind(this),
					type: 'POST',
					xhrFields: { withCredentials: true }
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
					url: apiDomain + '/outfits/' + options.model.get('_id') + '/likes',
					success: function(e) {
						options.model.fetch();
					}.bind(this),
					type: 'DELETE',
					xhrFields: { withCredentials: true }
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
					url: apiDomain + '/outfits/' + options.model.get('_id'),
					success: function(e) {
						options.model.fetch();
					}.bind(this),
					type: 'POST',
					xhrFields: { withCredentials: true }
				});

				e.preventDefault();
				return false;
			});

			$el.find('.reposted').click(function(e) {
				var stats = _.clone(options.model.get('stats'));
				stats.reposts--;

				var reposts = _.reject(_.clone(options.model.get('reposts')),
					function(repost) { return repost._id === options.session.get('userId'); }
				);

				options.model.set({'stats': stats, 'reposts': reposts});

				$.ajax({
					url: apiDomain + '/outfits/' + options.model.get('_id') + '/reposts',
					success: function(e) {
						options.model.fetch();
					}.bind(this),
					type: 'DELETE',
					xhrFields: { withCredentials: true }
				});

				e.preventDefault();
				return false;
			});

			$el.find('.delete').click(function(e) {
				options.model.destroy();

				$.ajax({
					url: apiDomain + '/outfits/' + options.model.get('_id'),
					type: 'DELETE',
					xhrFields: { withCredentials: true }
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
						url: apiDomain + '/outfits/' + options.model.get('_id') + '/comments',
						data: {
							body: body
						},
						success: function(e) {
							options.model.fetch();
						}.bind(this),
						type: 'POST',
						xhrFields: { withCredentials: true }
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

			$el.find('.delete').click(function(e) {
				var cId = $(this).parent().attr('data-id');

				var comments = _.reject(_.clone(options.model.get('comments')),
					function(comment) { return comment._id === cId; }
				);
				options.model.set('comments', comments);

				$.ajax({
					url: apiDomain + '/outfits/' + options.model.get('_id') + '/comments/' + cId,
					success: function(e) {
						options.model.fetch();
					}.bind(this),
					type: 'DELETE',
					xhrFields: { withCredentials: true }
				});
				
				e.preventDefault();
				return false;
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
					options.view.forward();
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
			var pieces = new PieceCollection(options.model.get('pieces'));
			var pieceListView = new PieceListView({collection: pieces});
			$el.find('.items').append(pieceListView.$el);

			var updatePieces = function() {
				options.model.set('pieces', pieces.toJSON());
			};
			pieces.bind('add', updatePieces);
			pieces.bind('remove', updatePieces);

			$el.find('input.item').keyup(function(e) {
				var itemList = $el.find('.item-list');
				itemList.empty();

				$el.find('.item-search .loading').removeClass('invisible');

				setTimeout(function(query) {
					if($(this).val() === query) {
						$.ajax({
							url: apiDomain + '/products',
							data: {'query': query},
							type: 'POST',
							xhrFields: { withCredentials: true }
						}).success(function(data) {
							$el.find('.item-search .loading').addClass('invisible');

							var items = data.Items.Item;
							_.each(items, function(item) {
								var piece = new Piece({
									'url': item.DetailPageURL,
									'image': item.MediumImage.URL,
									'title': item.ItemAttributes.Title,
									'brand': item.ItemAttributes.Brand
								});
								var pieceView = new PieceView({model: piece});
								itemList.append(pieceView.$el);

								pieceView.$el.click(function(e) {
									pieces.add(piece);
									itemList.empty();
									e.preventDefault();
									return false;
								});
							});
						});
					}
				}.bind(this), 500, $(this).val());
			});
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
		
		url: function() { return apiDomain + '/' + this.collectionPath + '/' + (this.id || ''); }
	});

	var User = Base.extend({
		collectionPath: 'users',
		defaults: {
			_id: '',
			date: Date.now()
		}
	});

	var Piece = Backbone.Model.extend({});

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
				url: apiDomain + '/auth/info',
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
				},
				xhrFields: { withCredentials: true }
			});
		},
		login: function(user, password, success, error) {
			var that = this;
			$.ajax(apiDomain + '/auth', {
				type: 'POST',
				data: { user: user, password: password },
				success: function(data) {
					if(typeof data.username !== 'undefined') window.location = '';
					else window.location = '/#/register';
					
					if(success) success(data);
				},
				error: function(data) {
					that.set('userId', null);
					that.set('user', null);
					if(error) error(data);
				},
				xhrFields: { withCredentials: true }
			});
		},
		register: function(data, success, error) {
			var that = this;
			$.ajax(apiDomain + '/users', {
				type: 'POST',
				data: data,
				xhrFields: { withCredentials: true }
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
		url: apiDomain + '/outfits'
	});

	var PieceCollection = Backbone.Collection.extend({
		model: Piece
	});

	// #### VIEWS ####

	var OutfitSummaryView = Torso.View.extend({
		tagName: 'li',
		className: 'box outfit summary hover-parent',
		template: _.template($('#template-outfit-summary').html()),

		initialize: function(options) {
			_.bindAll(this, 'setup', 'render', 'remove');
			this.model.on('change', this.render);
			this.model.on('destroy', this.remove);
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

	var PieceView = Torso.View.extend({
		tagName: 'li',
		className: 'piece span3',
		template: _.template($('#template-piece').html()),

		initialize: function() {
			_.bindAll(this, 'setup', 'render');
			this.model.on('change', this.render);
			this.render();
		}
	});

	var PieceListView = Torso.View.extend({
		tagName: 'ul',
		className: 'piece-list',

		initialize: function() {
			_.bindAll(this, 'setup', 'render');
			this.collection.on('change', this.render);
			this.collection.on('add', this.render);
			this.collection.on('remove', this.render);
			this.render();
		},

		render: function() {
			this.$el.empty();
			this.collection.each(function(piece) {
				var pieceView = new PieceView({model: piece});
				pieceView.$el.removeClass('span3').addClass('span12');
				this.$el.append(pieceView.$el);
			}.bind(this));
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
			this.model.on('destroy', this.remove);
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

		var mainScrollTop = 0;
		$(window).scroll(function(e) {
			if(app.container === 'main') {
				mainScrollTop = $(window).scrollTop();
			}
		});

		app.on('display:modal', function(e) {
			$('#main').css({
				'position': 'fixed'
			});

			$('#overlay').click(function(e) {
				if(e.target == document.getElementById('overlay')) window.history.back();
			});

			$(window).keydown(function(e) {
				if(e.which === 27) window.history.back();
			});
		});

		app.on('display:main', function(e) {
			$('#main').css({'position': 'static'});
			$(window).scrollTop(mainScrollTop);
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