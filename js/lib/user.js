(function(global){

	"use strict";

	var peer = null;

	function User(model, auction) {
		var ref = User.current.ref;
		this.auction = auction;
		this.model = model || {};
		this.current = ref ? ref.model.id === this.model.id : true;
		this.video = Video.get(this);
		if (this.current && peer)
			this.model.peer = peer.id;
	}

	User.sessionKey = "user.current";

	User.prototype.withDefaults = function() {

		if (!this.model.id) {
			var seed = utils.randomSeed();
			seed += document.referrer;
			seed += navigator.userAgent;
			Array.prototype.slice.call(navigator.plugins).forEach(function(p){
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

	User.prototype.peer = function() {
		return peer;
	};

	User.prototype.connect = function(done) {

		var user = this;

		// check for existing peer
		if (peer) {
			if (peer.destroyed) throw new Error('unable to reconnect to destroyed peer');
			else if (peer.disconnected) peer.reconnect();
			return done(null, peer.id);
		}

		// create a new peer
		peer = new Peer({key: 'nubs0cvy1d1jor'});
		peer.on('open', function(id){
			user.model.peer = id;
			user.cache().save(function(err){
				done(err, id);
			});
		});

	};

	User.prototype.connected = function() {
		return peer !== null;
	};

	User.prototype.disconnect = function(done) {
		if (!this.connected()) return done();
		peer.destroy(); peer = null;
		delete this.model.peer;
		this.cache().save(done);
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