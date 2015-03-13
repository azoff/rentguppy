(function(global){

	"use strict";

	function Bid(value, room, user) {
		this.room = room;
		this.user = user;
		this.model = { value: value };
	}

	Bid.prototype.withDefaults = function() {
		if (!this.model.id)
			this.model.id = this.room.model.id + '|' + this.user.model.id;
		return this;
	};


	global.Bid = Bid;

})(window);