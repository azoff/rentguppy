(function(global){

	"use strict";

	function User(model, auction) {
		var ref = User.current.ref;
		this.auction = auction;
		this.model = model || {};
		this.current = ref ? ref.model.id === this.model.id : true;
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