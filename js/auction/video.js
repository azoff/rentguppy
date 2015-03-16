(function(){

	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

	function main(event) {
		var user = event.detail.user;
		var auction = event.detail.auction;
		user.connect(app.guard());
		addEventListeners(user, auction);
	}

	function addEventListeners(user, auction) {
		addVideoClickListener(user, auction);
		addPeerCallListeners(user);
		addExitListener(user);
	}

	function addVideoClickListener(user, auction) {
		document.addEventListener('click', function(e){
			if (!utils.matches(e.target, '.user video')) return;
			var video = e.target;
			var node = video.parentNode;
			var source = node.source;
			if (!source) throw new Error('unable to modify video without source');
			if (source.model.id === user.model.id)
				toggleStream(user, auction);
		});
	}

	function addExitListener(user) {
		window.addEventListener('beforeunload', function(){
			disconnectUserStream(user);
		});
	}

	function addPeerCallListeners(user) {
		user.peer.on('call', function(call){
			var user = auction.peer(call.peer);
			if (!user) return;
			call.answer(user.video.stream);
			call.on('stream', acceptStream(user));
			call.on('disconnect', acceptStream(user));
			call.on('error', function(err){
				app.error('answer', user.model.id, err);
			});
		});
		user.peer.on('error', function(err){
			app.error('peer', user.model.id, err);
		});
	}

	function toggleStream(user, auction) {
		if (user.video.stream) disconnectUserStream(user);
		else connectUserStream(user, auction);
	}

	function disconnectUserStream(user) {
		setStream(user, null);
		user.disconnect(app.guard());
	}

	function connectUserStream(user, auction) {
		navigator.getUserMedia({ video: true }, function(stream){
			user.connect(app.guard());
			setStream(user, stream);
			shareStream(user, auction);
		}, app.guard());
	}

	function setStream(user, stream) {
		if (!stream) user.video.destroy();
		else user.video.create(stream);
		user.model.video = user.video.attr();
		user.save(app.guard());
	}

	function shareStream(user, auction) {
		auction.users().forEach(function(their){
			if (!their.model.peer) return;
			if (their.model.id === user.model.id) return;
			var call = user.peer.call(their.model.peer, user.video.stream);
			call.on('stream', acceptStream(their));
			call.on('error', function(err){
				app.error('call', their.model.id, err);
			});
		});
	}

	function acceptStream(user) {
		return function(stream) {
			setStream(user, stream);
		}
	}

	window.addEventListener('ready', main);

})();