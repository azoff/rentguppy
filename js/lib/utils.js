(function(global){

	"use strict";

	var utils = {};

	utils.hashCode = function(str) {
		var code, i, hash = 0;
		if (str.length == 0) return hash;
		for (i = 0; i < str.length; i++) {
			code = str.charCodeAt(i);
			hash = ((hash<<5)-hash)+code;
			hash = hash & hash;
		}
		if (hash < 0) return  "1" + hash.toString().substr(1);
		else return  hash.toString();
	};

	utils.randomSeed = function() {
		return utils.randomInt(0, Number.MAX_VALUE).toString();
	};

	utils.randomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	utils.intToHex = function(i) {
		var hex = i.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	};

	utils.rgbToHex = function(rgb) {
		return "#" + utils.intToHex(rgb[0]) + utils.intToHex(rgb[1]) + utils.intToHex(rgb[2]);
	};

	utils.randomNeutralRGB = function() {
		return [
			utils.randomInt(85, 170),
			utils.randomInt(85, 170),
			utils.randomInt(85, 170)
		];
	};

	utils.formatDollars = function(i) {
		var dollars = i.toString();
		var x = dollars.split('.');
		var x1 = x[0];
		var x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1))
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		return '$' + x1 + x2;
	};

	utils.cleanNumber = function(number) {
		return parseInt(number.replace(/[^\d]/g, ''), 10);
	};

	utils.valueAtPath = function fn(context, keypath, fallback) {
		var keys = keypath.split('.');
		var key = keys.shift();
		if (key in context) {
			context = context[key];
			keypath = keys.join('.');
			if (keys.length <= 0) return context;
			else return fn(context, keypath)
		}
		return fallback;
	};

	utils.debounced = function(fn, timeout) {
		return function(){
			var args = Array.prototype.slice.call(arguments);
			if (fn.timeout) clearTimeout(fn.timeout);
			fn.timeout = setTimeout(function(){
				fn.apply(null, args);
			}, timeout || 700);
		};
	};

	utils.matches = function(el, selector) {
		return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
	};

	utils.idSort = function(a, b) {
		return a.localeCompare(b);
	};

	utils.bidSort = function(a, b) {
		return b.model.value - a.model.value;
	};

	utils.idMapToSelector = function(idMap) {
		var ids = Object.keys(idMap);
		return '[data-id="' + ids.join('"][data-id="') + '"]'
	};

	utils.pruneChildren = function(el, ids) {
		Array.prototype.slice.call(el.childNodes).forEach(function(child){
			if (child.dataset.id in ids) return;
			el.removeChild(child);
		});
	};

	global.utils = utils;

})(window);