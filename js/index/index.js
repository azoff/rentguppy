"use strict";

var form = document.querySelector('form');
var rent = form.querySelector("[name=rent]");
var rooms = form.querySelector("[name=rooms]");
form.addEventListener("submit", function(e){
	e.preventDefault();
	document.body.classList.add("block");
	var irent = parseInt(rent.value, 10);
	var irooms = parseInt(rooms.value, 10);
	var auction = Auction.create(irent, irooms, function(err){
		if (err) app.error(err);
		else app.navigate(auction.url());
	})
});
