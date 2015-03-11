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

	utils.stamp = function() {
		return (new Date).getTime().toString();
	};

	global.utils = utils;

})(window);