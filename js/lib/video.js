(function(global){

	"use strict";

	var cache = {};

	function Video(muted) {
		this.muted = muted;
	}

	Video.get = function(user) {
		var video = cache[user.model.id];
		if (!video) {
			video = new Video(user.current);
			cache[user.model.id] = video;
		}
		return video;
	};

	Video.prototype.load = function(stream) {
		if (this.stream = stream)
			this.src = URL.createObjectURL(this.stream);
		if (this.src) {
			this.attr = 'autoplay src="' + this.src + '"';
			if (this.muted) this.attr = 'muted ' + this.attr;
		}
	};

	Video.prototype.unload = function() {
		if (this.stream) {
			var stream = this.stream;
			stream.getTracks().forEach(function(track){
				track.stop();
				stream.removeTrack(track);
			});
		}
		delete this.stream;
		delete this.src;
		delete this.attr;
		return this;
	};

	global.Video = Video;

})(window);