(function(global){

	"use strict";

	function Auction(model) {
		this.model = model || {};
	}

	Auction.prototype.withDefaults = function() {
		if (!this.model.id) {
			var seed = utils.randomSeed() + '|' + User.current().model.id;
			this.model.id = utils.hashCode(seed)
		}
		if (!this.model.name)
			this.model.name = "new auction";
		if (!this.model.users)
			this.model.users = {};
		if (!this.model.rooms)
			this.model.rooms = {};
		return this;
	};

	Auction.prototype.save = function(done) {
		this.ref().set(this.model, done)
	};

	Auction.prototype.ref = function(child) {
		var ref = app.auctions().child(this.model.id);
		if (child) ref = ref.child(child);
		return ref;
	};

	Auction.prototype.url = function(base) {
		var url = base || "/";
		url += "/auction/#";
		url += this.model.id;
		return url.replace(/\/\//g, '/');
	};

	Auction.prototype.users = function() {
		var users = [];
		var auction = this;
		var models = this.model.users;
		Object.keys(models).sort(utils.idSort).forEach(function(id){
			users.push(auction.user(id));
		});
		return users;
	};

	Auction.prototype.addUser = function(user, done) {
		user.auction = this;
		this.model.users[user.model.id] = user.model;
		if (done) user.save(done);
	};

	Auction.prototype.removeUser = function(user, done) {
		if (done) user.delete(done);
		delete this.model.users[user.model.id];
		delete user.auction;
	};

	Auction.prototype.user = function(id) {
		return new User(this.model.users[id], this).withDefaults();
	};

	Auction.prototype.peer = function(id) {
		var user = null;
		this.users().forEach(function(test){
			if (test.model.peer === id) user = test;
		});
		return user;
	};

	Auction.prototype.generateRoom = function(done) {
		var room = new Room(null, this).withDefaults();
		this.addRoom(room, done);
	};

	Auction.prototype.addRoom = function(room, done) {
		room.auction = this;
		this.model.rooms[room.model.id] = room.model;
		if (done) room.save(function(err){
			done(err, room);
		});
	};

	Auction.prototype.removeRoom = function(room, done) {
		if (done) room.delete(done);
		delete this.model.rooms[room.model.id];
		delete room.auction;
	};

	Auction.prototype.rooms = function() {
		var rooms = [];
		var auction = this;
		var models = this.model.rooms;
		Object.keys(models).sort(utils.idSort).forEach(function(id){
			rooms.push(auction.room(id));
		});
		return rooms;
	};

	Auction.prototype.room = function(id) {
		return new Room(this.model.rooms[id], this).withDefaults();
	};

	Auction.create = function(rent, rooms, done) {
		var auction = new Auction({ rent: rent }).withDefaults();
		for (var i=0; i<rooms; i++) auction.generateRoom();
		auction.save(function(err){ done(err, auction); });
	};

	Auction.load = function(id, done) {
		app.auctions().child(id).once('value', function(ref) {
			if (!ref.exists()) done(null, null);
			else done(null, new Auction(ref.val()).withDefaults());
		}, done);
	};

	global.Auction = Auction;

})(window);