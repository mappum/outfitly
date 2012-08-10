window.Torso = {};
(function(Torso) {
	Torso.View = Backbone.View.extend({
		template: _.template(''),

		initialize: function(options) {
			_.bindAll(this, 'setup', 'render');
			this.render(options);
		},

		render: function(options) {
			this.$el.html(this.template(options));
			this.setup(options);
		},

		setup: function() {}
	});

	Torso.Screen = Torso.View.extend({
		_isScreen: true,
		modal: false,

		initialize: function(options) {
			_.bindAll(this, 'setup', 'render');
			this.session = options.session;

			this.render(options);
		}
	});

	Torso.Router = Backbone.Router.extend({
		initialize: function(options) {
			this.app = options.app;
			this.routes = options.routes || {};

			this.on('all', function(event) {
				if(event.indexOf('route:' === 0)) {
					var args = Array.prototype.slice.call(arguments, 1);
					this.app.navigate(event.substr("route:".length), args);
				}
			}.bind(this));

			Backbone.history.start();
		}
	});

	Torso.App = Backbone.View.extend({
		initialize: function(options) {
			_.bindAll(this, 'display', 'clear', 'navigate');

			this.session = options.session || new Backbone.Model();

			this.defaults = options.defaults || {};
			this.containers = options.containers || {};
			this.screens = options.screens || {};

			this.initialized = false;
			this.lastContainer = undefined;

			for(var container in this.defaults) {
				this.navigate(this.defaults[container], null, container);
			}
		},

		// displays an instance of a ScreenView in the specified container
		display: function(screen, container) {
			container = container || ((screen.modal && this.initialized) ? 'modal' : 'main');
			var el = this.containers[container];

			if(typeof el !== 'undefined') {
				if(screen) {
					var e = {
						container: container,
						el: el,
						screen: screen
					};

					this.trigger('predisplay', e);
					this.trigger('predisplay:' + container, e);

					if(container === 'main' && this.container === 'modal') {
						this.clear('modal');
					} else {
						if(el.hasClass('populated')) this.clear(container);
						el.addClass('populated')
							.append(screen.$el);
					}

					this.container = container;

					this.trigger('display', e);
					this.trigger('display:' + container, e);
				} else {
					var e = {
						container: container,
						el: el
					};
					this.trigger('preclear', e);
					this.trigger('preclear:' + container, e);


					el.empty();
					if(el.hasClass('populated')) {
						el.removeClass('populated');
					}

					this.trigger('clear', e);
					this.trigger('clear:' + container, e);
				}

				if(container === 'main') this.initialized = true;
			} else {
				throw new Error('Invalid container "' + container + '"');
			}
		},

		clear: function(container) {
			this.display(null, container);
		},

		// creates an instance of the specified screen with args, displays in container
		navigate: function(Screen, args, container) {
			var name;
			if(typeof Screen === 'string') {
				name = Screen;
				Screen = this.screens[name];
			}

			if(typeof Screen !== 'undefined') {
				var screen = new Screen({session: this.session, args: args});
				this.display(screen, container);
			} else {
				throw new Error('No Screen was defined for id "' + name + '"');
			}
		}
	});
})(window.Torso);