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

	Video.prototype.removeTracks = function() {
		var stream = this.stream;
		if (!stream) return;
		stream.getTracks().forEach(stream.removeTrack.bind(stream))
	};

	Video.prototype.destroy = function() {
		this.removeTracks();
		delete this.call;
		delete this.stream;
		delete this.src;
		delete this.attr;
		delete cache[this.id];
		return this;
	};

	global.Video = Video;

})(window);