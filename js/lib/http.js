(function(global){

	"use strict";

	var http = {};

	http.request = function(method, url, data, done) {

		var request = new XMLHttpRequest();
		request.open(method, url, true);
		request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

		request.onload = function() {
			if (request.status >= 200 && request.status < 400) {
				done(null, request.responseText, request);
			} else {
				done(null, new Error("received bad http status: " + request.status), request);
			}
		};

		request.onerror = function(err) {
			done(null, err, request);
		};

		if (data !== undefined && typeof data !== "string")
			data = http.encode(data);

		request.send(data);

	};

	http.encode = function(data) {

		var pairs = [];

		Object.keys(data).forEach(function(key){
			var pair = [encodeURIComponent(key)];
			pair.push(encodeURIComponent(data[key]));
			pairs.push(pair.join('='));
		});

		return pairs.join('&');

	};

	global.http = http;

})(window);