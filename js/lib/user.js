(function(global){

	"use strict";

	function User(model) {
		this.model = model || {};
	}

	User.sessionKey = "user.current";

	User.prototype.save = function(done) {

		if (!this.model.id) {
			var seed = utils.stamp();
			seed += document.referrer;
			seed += navigator.userAgent;
			[].slice.call(navigator.plugins).forEach(function(p){
				seed += p.name;
				seed += p.description;
			});
			this.model.id = utils.hashCode(seed)
		}

		if (!this.model.name) {
			this.model.name = "anonymous";
		}

		app.session.setItem(User.sessionKey, JSON.stringify(this.model));
		app.users().child(this.model.id).set(this.model, done)

	};

	User.prototype.join = function(auction, done) {
		this.model.auction_id = auction.model.id;
		this.save(done);
	};

	User.prototype.leave = function(done) {
		this.model.auction_id = null;
		this.save(done);
	};

	User.current = function c(done) {
		if (c.ref) return c.ref;
		var model = app.session.getItem(User.sessionKey);
		c.ref = new User(model ? JSON.parse(model) : null);
		if (!model) c.ref.save(done);
		return c.ref;
	};

	global.User = User;

})(window);