(function(global){

	"use strict";

	var app = {};

	app.session = localStorage;
	app.error = console.error.bind(console);

	app.navigate = function(href){
		window.location.href = href;
	};

	app.firebase = function fn() {
		if (fn.ref) return fn.ref;
		fn.ref = new Firebase("https://crackling-fire-999.firebaseio.com/");
		return fn();
	};

	app.auctions = function() {
		return app.firebase().child("auctions")
	};

	app.guard = function(fn) {
		return function(err, out) {
			if (err) app.error(err);
			else if (fn) fn(out);
		}
	};

	global.app = app;

})(window);