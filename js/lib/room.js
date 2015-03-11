(function(global){

	"use strict";

	function Room(model) {
		this.model = model || {};
	}

	Room.prototype.save = function(done) {

		if (!this.model.auction_id) {
			throw new Error("auction id required to save room")
		}

		if (!this.model.id) {
			var seed = utils.stamp() + '|' + this.model.auction_id;
			this.model.id = utils.hashCode(seed)
		}

		if (!this.model.name)
			this.model.name = "New Room";

		app.rooms().child(this.model.id).set(this.model, done)

	};

	Room.create = function(auction, done) {
		var room = new Room({ auction_id: auction.model.id });
		room.save(done);
		return room
	};

	global.Room = Room;

})(window);