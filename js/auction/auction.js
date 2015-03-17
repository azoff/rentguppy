(function(){

	"use strict";

	templates.register('user',
		'<li class="user" data-id="{{ model.id }}">' +
		'<video {{ video.attr }} data-toggle="{{ current }}" class="avatar" style="background-color:{{ model.color }}"></video>' +
		'<h3 contenteditable="{{ current }}">{{ model.name }}</h3>' +
		'</li>'
	);

	templates.register('room',
		'<li class="room" data-id="{{ model.id }}">' +
		'<h3 contenteditable="true">{{ model.name }}</h3>' +
		'<a class="delete">&times;</a>' +
		'<ul class="bids"></ul>' +
		'<form>' +
		'<input class="bid" type="number" min="0" step="1" placeholder="Your max..." />' +
		'<button type="submit">Bid!</button>' +
		'<div class="price-container"></div>' +
		'</form>' +
		'</li>'
	);

	templates.register('price',
		'<div class="price" data-id="{{ model.id }}">' +
		'<video {{ user.video.attr }} class="avatar" style="background-color:{{ user.model.color }}"></video>' +
		'<h4 class="value {{ value_class }}">{{ model.formatted }}</h4>' +
		'</div>'
	);

	templates.register('bid',
		'<li class="bid" data-id="{{ model.id }}">' +
		'<video {{ user.video.attr }} class="avatar" style="background-color:{{ user.model.color }}"></video>' +
		'<span class="value">${{ model.value }}</span>' +
		'</li>'
	);

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
			utils.trigger(window, 'ready', { auction: auction, user: user });
		}));
	}

	function addEventListeners(user, auction) {
		addBidListener(user, auction);
		addNewRoomListener(auction);
		addRemoveRoomListener(auction);
		addRenderListener(auction);
		addFocusBidListener();
		addContentListeners();
	}

	function addRenderListener(auction) {
		window.addEventListener('render', function(){
			render(auction);
		});
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
			target = null;

		}

		function mark(e) {
			if (!utils.matches(e.target, "[contenteditable=true]")) return;
			if (target && target !== target) save(e);
			target = e.target;
		}

		document.body.addEventListener('keydown', mark);
		document.body.addEventListener('paste', mark);
		document.body.addEventListener('input', mark);
		document.body.addEventListener('click', save);
		document.body.addEventListener('keydown', save);
	}

	function addBidListener(user, auction) {
		ELS.rooms.addEventListener('submit', function(e){

			e.preventDefault();

			var room = auction.room(e.target.parentNode.dataset.id);
			var value = e.target.childNodes[0].value;
			var bid, bids = room.bids();

			// find a default bid value if none was provided
			if (!value) {
				if (bids.length > 0) {
					if (bids[0].user.model.id === user.model.id)
						return app.error('you already have the top bid!');
					else bid = bids[0].model.value + 1;
				} else {
					bid = 1;
				}
			} else {
				bid = utils.cleanNumber(value);
			}

			// validate the number submission
			if (isNaN(bid)) return app.error('please enter a valid bid amount');

			// remove the bid if less than 1, or add the bid if greater than 1
			if (bid < 1) room.redactBid(user, app.guard());
			else room.placeBid(user, bid, app.guard());
			//if (bid < 1) room.redactBid(user);
			//else room.placeBid(user, bid);
			//render(auction);
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
			if (!utils.matches(e.target, '.delete')) return;
			e.preventDefault();
			var target = e.target.parentNode;
			if (!target.source) throw new Error('unable to delete room, missing model source');
			auction.removeRoom(target.source, app.guard(function(){
				if (target.parentNode)
					target.parentNode.removeChild(target);
			}));
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
		var count = rooms.length;
		var prices = {};
		var bidcount = 0;
		var sum = 0;

		// get the market price ranges for rooms
		rooms.forEach(function(room){
			var model = { id: room.model.id };
			var source = { model: model };
			prices[room.model.id] = source;
			var bids = room.bids();
			var len = bids.length;
			if (len > 0) {
				var bid = bids[0];
				source.user = bid.user;
				source.value_class = 'user';
				model.value = bid.model.value;
				bidcount++;
			}
			sum += model.value;
		});


		var opencount = count - bidcount;
		var remaining = total - sum;

		// for open rooms, split the remainder evenly
		if (opencount > 0) {
			var split = remaining / opencount;
			rooms.forEach(function(room){
				var source = prices[room.model.id];
				if (source.user) return;
				source.model.value = split;
			});
		}

		// render the prices into the price containers
		Object.keys(prices).forEach(function(id){
			var source = prices[id];
			var parent = ELS.rooms.querySelector('[data-id="'+id+'"] .price-container');
			source.model.formatted = utils.formatDollars(source.model.value);
			renderModel('price', source, parent);
		});

		// render the remaining value
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
		renderModel('room', room, ELS.rooms);
		renderBids(room);
	}

	function renderBids(room) {
		var parent = ELS.rooms.querySelector('[data-id="' + room.model.id + '"] .bids');
		utils.pruneChildren(parent, room.model.bids);
		room.bids().forEach(function(bid, index){
			renderBid(index, bid, parent);
		});
	}

	function renderBid(index, bid, parent) {
		if (!parent)
			parent = ELS.rooms.querySelector('[data-id="' + bid.room.model.id + '"] .bids');
		renderModel('bid', bid, parent, index);
	}

	function renderModel(template, source, parent, index) {
		//TODO: cache these?
		var selector = '[data-id="' + source.model.id + '"]';
		var existing = parent.querySelector(selector);
		var node, rendered = templates.renderNode(template, source);
		if (existing) {
			node = existing;
			if (rendered.outerHTML !== existing.html) {
				existing.outerHTML = rendered.outerHTML;
				node = parent.querySelector(selector);
				node.html = rendered.outerHTML;
			}
		} else {
			node = rendered;
			node.html = rendered.outerHTML;
			parent.appendChild(rendered);
		}
		if (index >= 0 && !utils.indexMatches(index, node, parent))
			parent.insertBefore(node, parent.childNodes[index]);
		node.source = source;
	}

})();