(function(global){

	"use strict";

	function Room(model, auction) {
		this.auction = auction;
		this.model = model || {};
	}

	Room.prototype.withDefaults = function() {
		if (!this.model.id) {
			var seed = utils.randomSeed() + '|' + this.model.auction_id;
			this.model.id = utils.hashCode(seed)
		}
		if (!this.model.name)
			this.model.name = "New Room";
		if (!this.model.bids)
			this.model.bids = {};
		return this;
	};

	Room.prototype.placeBid = function(user, bid, done) {
		var id = user.model.id;
		this.model.bids[id] = bid;
		if (done) {
			var ref = this.ref("bids");
			if (!ref) done(new Error("unable to lookup bid reference, unknown parent auction"));
			ref.child(id).set(bid, done);
		}
	};

	Room.prototype.bids = function() {
		var bids = [];
		var room = this;
		Object.keys(room.model.bids).forEach(function(key){
			bids.push(room.bid(key));
		});
		return bids.sort(utils.bidSort);
	};

	Room.prototype.bid = function(id) {
		if (!this.auction) throw new Error("unable to lookup bids, unknown parent auction");
		var user = this.auction.user(id);
		return new Bid(this.model.bids[id], this, user).withDefaults();
	};

	Room.prototype.redactBid = function(user, done) {
		var id = user.model.id;
		delete this.model.bids[id];
		if (done) {
			var ref = this.ref("bids");
			if (!ref) done(new Error("unable to lookup bid reference, unknown parent auction"));
			ref.child(id).remove(done);
		}
	};

	Room.prototype.ref = function(child) {
		if (!this.auction) return null;
		var ref = this.auction.ref('rooms').child(this.model.id);
		if (child) ref = ref.child(child);
		return ref;
	};

	Room.prototype.save = function(done) {
		var ref = this.ref();
		if (!ref) done(new Error("unable to lookup room reference, unknown parent auction"));
		else ref.set(this.model, done);
	};

	Room.prototype.delete = function(done) {
		var ref = this.ref();
		if (!ref) done(new Error("unable to delete room reference, unknown parent auction"));
		else ref.remove(done);
	};

	global.Room = Room;

})(window);