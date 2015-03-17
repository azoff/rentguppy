(function(global){

	"use strict";

	function User(model, auction) {
		var ref = User.current.ref;
		this.auction = auction;
		this.model = model || {};
		this.current = ref ? ref.model.id === this.model.id : true;
		this.video = Video.get(this);
		delete this.model.peer;
	}

	User.sessionKey = "user.current";

	User.prototype.withDefaults = function() {

		if (!this.model.id) {
			var seed = utils.randomSeed();
			seed += document.referrer;
			seed += navigator.userAgent;
			[].slice.call(navigator.plugins).forEach(function(p){
				seed += p.name;
				seed += p.description;
			});
			this.model.id = utils.hashCode(seed)
		}

		if (!this.model.name)
			this.model.name = "anonymous";

		if (!this.model.color)
			this.model.color = utils.rgbToHex(utils.randomNeutralRGB());

		return this;

	};

	User.prototype.cache = function() {
		app.session.setItem(User.sessionKey, JSON.stringify(this.model));
		return this;
	};

	User.prototype.connect = function(done) {

		var user = this;

		// check for existing peer
		if (user.peer) {
			if (user.peer.destroyed)
				throw new Error('unable to reconnect to destroyed peer');
			else if (user.peer.disconnected)
				user.peer.reconnect();
			return done(null, user.peer.id);
		}

		// create a new peer
		user.peer = new Peer({key: 'nubs0cvy1d1jor'});
		user.peer.on('open', function(id){
			user.model.peer = id;
			user.save(function(err){
				done(err, id);
			});
		});

	};

	User.prototype.connected = function() {
		return this.peer && !this.peer.disconnected && !this.peer.destroyed && this.model.peer === this.peer.id;
	};

	User.prototype.disconnect = function(destroy, done) {
		if (!this.connected()) return done();
		this.peer.destroy();
		delete this.model.peer;
		delete this.peer;
		this.save(done);
	};

	User.prototype.ref = function() {
		if (!this.auction) return null;
		return this.auction.ref('users').child(this.model.id);
	};

	User.prototype.save = function(done) {
		var ref = this.ref();
		if (!ref) done(new Error("unable to lookup user reference, unknown parent auction"));
		ref.set(this.model, done);
	};

	User.prototype.delete = function(done) {
		var ref = this.ref();
		if (!ref) done(new Error("unable to delete user reference, unknown parent auction"))
		ref.remove(done);
	};

	User.current = function c() {
		if (c.ref) return c.ref;
		var model = app.session.getItem(User.sessionKey);
		c.ref = new User(model ? JSON.parse(model) : null);
		return c.ref.withDefaults().cache();
	};

	global.User = User;

})(window);