(function(global){

	"use strict";

	var app = {};
	var error = document.getElementById('error');

	app.session = localStorage;

	app.error = function(msg) {
		msg = Array.prototype.slice.call(arguments).join(' ');
		msg = msg.substr(0,1).toUpperCase() + msg.substr(1);
		error.innerHTML = msg;
		error.classList.add('open');
		if (error.timeout) clearTimeout(error.timeout);
		error.timeout = setTimeout(function(){
			delete error.timeout;
			error.classList.remove('open');
		}, 3000);
	};

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
			if (err) {
				var msg = err.message || err.msg || err.toString();
				app.error('Oops! Something Broke.', msg);
			} else if (fn) {
				fn(out);
			}
		}
	};

	global.app = app;

})(window);