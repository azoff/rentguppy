"use strict";

var form = document.querySelector('form');
var rent = form.querySelector("[name=rent]");
var rooms = form.querySelector("[name=rooms]");
form.addEventListener("submit", submit);

function submit(e) {
	e.preventDefault();
	document.body.classList.add("block");
	var irent = parseInt(rent.value, 10);
	var irooms = parseInt(rooms.value, 10);
	Auction.create(irent, irooms, function(err, auction) {
		if (err) return app.error(err);
		app.navigate(auction.url(location.pathname));
	});
}



