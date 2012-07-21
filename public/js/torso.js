window.Torso = {};
(function(Torso) {
	Torso.Screen = Backbone.View.extend({
		template: _.template(''),
		_isScreen: true,

		initialize: function(options) {
			_.bindAll(this, 'setup', 'render');
			this.session = options.session;

			this.render(options);
		},

		render: function(options) {
			this.$el.html(this.template(options));
			this.setup(options);
		},

		setup: function() { }
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
			_.bindAll(this, 'display', 'navigate');

			this.session = options.session || new Backbone.Model();

			this.defaults = options.defaults || {};
			this.containers = options.containers || {};
			this.screens = options.screens || {};

			for(var container in this.defaults) {
				this.navigate(this.defaults[container], null, container);
			}
		},

		// displays an instance of a ScreenView in the specified container
		display: function(screen, container) {
			container = container || 'main';
			var el = this.containers[container];

			if(typeof el !== 'undefined') {
				el.empty();
				el.append(screen.$el);
			}
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