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
		if (this.src)
			this.attr = 'autoplay src="' + this.src + '"';
	};

	Video.prototype.destroy = function() {
		if (this.call) this.call.close();
		delete this.call;
		delete this.stream;
		delete this.src;
		delete this.attr;
		delete cache[this.id];
		return this;
	};

	global.Video = Video;

})(window);