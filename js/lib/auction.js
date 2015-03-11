(function(global){

	"use strict";

	function Auction(model) {
		this.model = model || {};
	}

	Auction.prototype.save = function(done) {

		if (!this.model.id) {
			var user = User.current();
			var seed = utils.stamp() + '|' + user.model.id;
			this.model.id = utils.hashCode(seed)
		}

		if (!this.model.name) {
			this.model.name = "new auction";
		}

		app.auctions().child(this.model.id).set(this.model, done)

	};

	Auction.prototype.url = function() {
		return "/auction/#" + this.model.id;
	};

	Auction.create = function(rent, rooms, done) {
		var auction = new Auction({ rent: rent });
		auction.save(function(err){
			if (err) return done(err);
			var i, wait = rooms;
			for (i=0; i<rooms; i++) {
				Room.create(auction, function(ierr){
					if (err) return;
					if (ierr) return done(err = ierr);
					if (--wait <= 0) done();
				});
			}
		});
		return auction
	};

	Auction.load = function(id, done) {
		app.auctions().child(id).once('value', function(modelRef) {
			done(modelRef.exists() ? new Auction(modelRef.val()) : null)
		});
	};

	global.Auction = Auction;

})(window);