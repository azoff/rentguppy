(function(global){

	"use strict";

	var cache = {};

	function Video(muted) {
	}

	Video.get = function(user) {
		var video = cache[user.model.id];
		if (!video) {
			video = new Video().mute(user.current);
			cache[user.model.id] = video;
		}
		return video;
	};

	Video.prototype.load = function(stream) {
		if (this.stream = stream)
			this.src = URL.createObjectURL(this.stream);
		if (this.src)
			this.attr = 'autoplay src="' + this.src + '"';
	};

	Video.prototype.mute = function(muted) {
		if (muted) this.muted = 'muted';
		else delete this.muted;
		if (this.stream) this.stream.getTracks().forEach(function(track){
			if (track.kind === 'audio') track.enabled = !muted;
		});
		return this;
	};

	Video.prototype.enabled = function(enabled) {

	};

	Video.prototype.unload = function() {
		if (this.stream) {
			var stream = this.stream;
			stream.getTracks().forEach(function(track){
				track.stop();
			});
		}
		delete this.muted;
		delete this.stream;
		delete this.src;
		delete this.attr;
		return this;
	};

	global.Video = Video;

})(window);