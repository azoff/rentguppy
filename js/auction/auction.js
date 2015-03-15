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
	addFocusBidListener();
	addContentListeners();
}

function addFocusBidListener() {
	ELS.rooms.addEventListener('click', function(e){
		if (!utils.matches(e.target, '.bids')) return;
		e.target.nextSibling.childNodes[0].focus();
	});
}

function addEventReceiver(auction) {
	auction.ref().on('value', function(e){
		auction.model = e.val();
		render(auction.withDefaults());
	}, app.guard());
}

function addContentListeners() {
	var target;

	function save(e) {

		if (!target) return;
		var targeted = e.target === target;
		if (e.type === 'click' && targeted) return;
		else if (e.which !== 13 && e.which !== 27 && targeted) return;
		else if (e.type === 'keyup') e.preventDefault();

		if (targeted) target.blur();

		var key = 'name';
		if (target.dataset.key)
			key = target.dataset.key;
		var source = target.parentNode.source;
		if (!source)
			throw new Error("unable to edit content without model source");
		source.model[key] = target.innerText;
		if (target.dataset.type === 'number')
			source.model[key] = utils.cleanNumber(source.model[key]);
		source.save(app.guard());
		if (source.cache) source.cache();

	}

	function mark(e) {
		if (!utils.matches(e.target, "[contenteditable=true]")) return;
		target = e.target;
	}

	document.body.addEventListener('keyup', mark);
	document.body.addEventListener('paste', mark);
	document.body.addEventListener('input', mark);
	document.body.addEventListener('click', save);
	document.body.addEventListener('keyup', save);
}

function addBidListener(user, auction) {
	ELS.rooms.addEventListener("submit", function(e){
		e.preventDefault();
		var bid = utils.cleanNumber(e.target.childNodes[0].value);
		var room = auction.room(e.target.parentNode.dataset.id);
		if (isNaN(bid)) return app.error("please enter a valid bid amount");
		if (bid < 1) return app.error("bids must be positive numbers");
		if (bid > ELS.remaining.value) return app.error("bids must be less than the remaining rent");
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
	renderPrices(auction);
}

function renderPrices(auction) {

	var total = auction.model.rent;
	var rooms = auction.rooms();
	var size = rooms.length;
	var prices = {};
	var sum = 0;

	// first, get the prices for rooms with bids
	rooms.forEach(function(room){
		var model = { id: room.model.id };
		var source = { model: model };
		prices[room.model.id] = source;
		var bids = room.bids();
		switch (bids.length) {
			case 0: return;
			case 1:
				model.value = bids[0].model.value;
				break;
			default:
				model.value = bids[1].model.value + 1;
				break;
		}
		source.value_class = 'user';
		source.user = bids[0].user;
		sum += model.value;
		size--;
	});

	// next, split the remaining total amongst the non-bid rooms
	var remaining = total - sum;
	var split = Math.ceil(remaining / size);
	rooms.forEach(function(room){
		var model = prices[room.model.id].model;
		if (!model.value) model.value = split;
	});

	// render the prices into the price containers
	Object.keys(prices).forEach(function(id){
		var source = prices[id];
		var parent = ELS.rooms.querySelector('[data-id="'+id+'"] .price-container');
		source.model.formatted = utils.formatDollars(source.model.value);
		renderModel('price', source, parent);
	});

	// set the remaining bids available
	ELS.remaining.value = remaining;
	ELS.remaining.innerText = utils.formatDollars(remaining);

}

function renderAuctionCopy(auction) {
	var total = auction.model.rent;
	ELS.total.parentNode.source = auction;
	ELS.auctionName.parentNode.source = auction;
	ELS.auctionName.innerText = auction.model.name;
	ELS.total.innerText = utils.formatDollars(total);
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
	renderModel('room', room, ELS.rooms, true);
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

function renderModel(template, source, parent, noupdates) {
	//TODO: cache these?
	var selector = '[data-id="' + source.model.id + '"]';
	var existing = parent.querySelector(selector);
	if (existing) {
		if (!noupdates) {
			existing.outerHTML = templates.render(template, source);
			parent.querySelector(selector).source = source;
		}
	} else {
		var node = templates.renderNode(template, source);
		node.source = source;
		parent.appendChild(node);
	}
}

templates.register('user',
	'<li class="user" data-id="{{ model.id }}">' +
	'<canvas class="avatar" style="background-color:{{ model.color }}"></canvas>' +
	'<h3 contenteditable="{{ current }}">{{ model.name }}</h3>' +
	'</li>'
);

templates.register('room',
	'<li class="room" data-id="{{ model.id }}">' +
	'<h3 contenteditable="true">{{ model.name }}</h3>' +
	'<a class="delete">&times;</a>' +
	'<ul class="bids"></ul>' +
	'<form>' +
	'<input class="bid" type="number" min="1" step="1" placeholder="Set bid..." />' +
	'<button type="submit">Bid!</button>' +
	'<div class="price-container"></div>' +
	'</form>' +
	'</li>'
);

templates.register('price',
	'<div class="price" data-id="{{ model.id }}">' +
	'<canvas class="avatar" style="background-color:{{ user.model.color }}"></canvas>' +
	'<h4 class="value {{ value_class }}">{{ model.formatted }}</h4>' +
	'</div>'
);

templates.register('bid',
	'<li class="bid" data-id="{{ model.id }}">' +
	'<canvas class="avatar" style="background-color:{{ user.model.color }}"></canvas>' +
	'<span class="value">${{ model.value }}</span>' +
	'</li>'
);