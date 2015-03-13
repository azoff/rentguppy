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

function main(auction) {
	if (!auction) return back();
	var user = User.current();
	auction.addUser(user, function(err){
		if (err) return app.error(err);
		render(auction);
		addEventListeners(user, auction);
		document.body.classList.remove('loading');
	});
}

function addEventListeners(user, auction) {
	addExitListener(user, auction);
	addBidListener(user, auction);
}

function addBidListener(user, auction) {
	ELS.rooms.addEventListener("submit", function(e){
		e.preventDefault();
		var bid = parseInt(e.target.childNodes[0].value, 10);
		var room = auction.room(e.target.parentNode.dataset.id);
		if (bid < 1 || isNaN(bid)) return app.error("bids must be greater than zero dollars!");
		room.placeBid(user, bid, function(err, bid){
			if (err) return app.error(err);
			renderBid(bid)
		});
	});
}

function addExitListener(user, auction) {
	window.addEventListener('beforeunload', function(){
		auction.removeUser(user, function(err){
			if (err) return app.error(err);
		});
	});
}

function render(auction) {
	auction.users().forEach(renderUser);
	auction.rooms().forEach(renderRoom);
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
	ELS.auctionName.innerText = auction.model.name;
	ELS.total.innerText = utils.formatDollars(total);
	ELS.remaining.innerText = utils.formatDollars(total-sumTopBids());
}

function renderUser(user) {
	renderModel('user', user, ELS.roommates);
}

function renderRoom(room) {
	renderModel('room', room, ELS.rooms);
	room.bids().forEach(renderBid);
}

function renderBid(bid) {
	var parent = ELS.rooms.querySelector('[data-id="' + bid.room.model.id + '"] .bids');
	renderModel('bid', bid, parent);
}

function renderModel(template, model, parent) {
	//TODO: cache these?
	var existing = parent.querySelector('[data-id="' + model.model.id + '"]');
	if (existing) existing.outerHTML = templates.render(template, model);
	else parent.appendChild(templates.renderNode(template, model));
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