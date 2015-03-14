var ELS = {
	auctionName: document.getElementById('auction-name'),
	roommates: document.getElementById('roommates'),
	rooms: document.getElementById('rooms'),
	total: document.querySelector('.rent.total .dollars'),
	remaining: document.querySelector('.rent.remaining .dollars'),
	adder: document.querySelector('.adder')
};

Auction.load(location.hash.substr(1), main);

function back() {
	app.navigate(location.pathname.replace('auction', ''));
}

function main(err, auction) {
	if (err) app.error(err);
	if (!auction) return back();
	var user = User.current();
	window.auction = auction;
	auction.addUser(user, app.guard(function(){
		addEventListeners(user, auction);
		addEventReceiver(auction);
		render(auction);
	}));
}

function addEventListeners(user, auction) {
	addBidListener(user, auction);
	addNewRoomListener(auction);
	addRemoveRoomListener(auction);
	addContentListeners();
}

function addEventReceiver(auction) {
	auction.ref().on('value', function(e){
		auction.model = e.val();
		render(auction.withDefaults());
	}, app.guard());
}

function addContentListeners() {
	document.body.addEventListener("input", utils.debounced(function(e){
		var target = e.target;
		if (!utils.matches(target, "[contenteditable=true]"))
			return;
		var source = target.parentNode.source;
		if (!source)
			throw new Error("unable to edit content without model source");
		source.model.name = target.innerText;
		source.save(app.guard());
		if (source.cache) source.cache();
	}, 1500));
}

function addBidListener(user, auction) {
	ELS.rooms.addEventListener("submit", function(e){
		e.preventDefault();
		var bid = parseInt(e.target.childNodes[0].value, 10);
		var room = auction.room(e.target.parentNode.dataset.id);
		if (isNaN(bid)) return app.error("please enter a valid bid amount");
		if (bid < 1) return app.error("bids must be positive numbers");
		if (bid > auction.rent) return app.error("bids must be less than the total rent");
		room.placeBid(user, bid, app.guard(renderBid));
	});
}

function addNewRoomListener(auction) {
	ELS.adder.addEventListener('click', function(e){
		e.preventDefault();
		auction.generateRoom(app.guard(renderRoom));
	});
}

function addRemoveRoomListener(auction) {
	ELS.rooms.addEventListener('click', function(e){
		if (!utils.matches(e.target, ".delete")) return;
		e.preventDefault();
		var target = e.target.parentNode;
		if (!target.source) throw new Error("unable to delete room, missing model source");
		auction.removeRoom(target.source, app.guard());
		if (target.parentNode)
			target.parentNode.removeChild(target);
	});
}

function render(auction) {
	document.body.classList.remove('loading');
	renderUsers(auction);
	renderRooms(auction);
	renderAuctionCopy(auction);
}

function sumTopBids() {
	var total = 0;
	//TODO: make this work
	//var nodes = document.querySelectorAll(".bid:first-child .value");
	//Array.prototype.slice.call(nodes).forEach(function(node){
	//	total += parseInt(node.innerText, 10);
	//});
	return total;
}

function renderAuctionCopy(auction) {
	var total = auction.model.rent;
	ELS.auctionName.parentNode.source = auction;
	ELS.auctionName.innerText = auction.model.name;
	ELS.total.innerText = utils.formatDollars(total);
	ELS.remaining.innerText = utils.formatDollars(total-sumTopBids());
}

function renderUsers(auction) {
	utils.pruneChildren(ELS.roommates, auction.model.users);
	auction.users().forEach(renderUser)
}

function renderRooms(auction) {
	utils.pruneChildren(ELS.rooms, auction.model.rooms);
	auction.rooms().forEach(renderRoom);
}

function renderUser(user) {
	renderModel('user', user, ELS.roommates);
}

function renderRoom(room) {
	renderModel('room', room, ELS.rooms);
	renderBids(room);
}

function renderBids(room) {
	var parent = ELS.rooms.querySelector('[data-id="' + room.model.id + '"] .bids');
	utils.pruneChildren(parent, room.model.bids);
	room.bids().forEach(function(bid){
		renderBid(bid, parent);
	});
}

function renderBid(bid, parent) {
	if (!parent)
		parent = ELS.rooms.querySelector('[data-id="' + bid.room.model.id + '"] .bids');
	renderModel('bid', bid, parent);
}

function renderModel(template, source, parent) {
	//TODO: cache these?
	var selector = '[data-id="' + source.model.id + '"]';
	var existing = parent.querySelector(selector);
	if (existing) {
		existing.outerHTML = templates.render(template, source);
		parent.querySelector(selector).source = source;
	} else {
		var node = templates.renderNode(template, source);
		node.source = source;
		parent.appendChild(node);
	}
}

templates.register('user',
	'<li class="user" data-id="{{ model.id }}">' +
	'<div class="avatar" style="background-image:{{ model.avatar }};background-color:{{ model.color }}"></div>' +
	'<h3 contenteditable="{{ current }}">{{ model.name }}</h3>' +
	'</li>'
);

templates.register('room',
	'<li class="room" data-id="{{ model.id }}">' +
	'<h3 contenteditable="true">{{ model.name }}</h3>' +
	'<a class="delete">&times;</a>' +
	'<ul class="bids"></ul>' +
	'<form>' +
	'<input class="bid" type="number" min="1" step="1" placeholder="Place a bid..." />' +
	'<button type="submit">Bid!</button>' +
	'</form>' +
	'</li>'
);

templates.register('bid',
	'<li class="bid" data-id="{{ model.id }}">' +
	'<div class="avatar" style="background-image:{{ user.model.avatar }};background-color:{{ user.model.color }}"></div>' +
	'<span class="value">${{ model.value }}</span>' +
	'</li>'
);