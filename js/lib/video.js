(function(global){

	"use strict";

	var cache = {};

	function Video() {
	}

	Video.get = function(user) {
		var video = cache[user.model.id];
		if (!video) {
			video = new Video();
			cache[user.model.id] = video;
		}
		return video;
	};

	Video.prototype.create = function(stream) {
		if (stream === undefined)
			stream = cache[stream];
		if (this.stream = stream)
			this.src = URL.createObjectURL(this.stream);
	};

	Video.prototype.attr = function() {
		return this.src ? ('autoplay src="' + this.src + '"') : '';
	};


	Video.prototype.destroy = function() {
		delete this.stream;
		delete this.src;
		delete cache[this.id];
		return this;
	};

	global.Video = Video;

})(window);