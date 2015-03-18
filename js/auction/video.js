(function(){

	var media = { video: true, audio: true };
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

	function main(event) {
		var user = event.detail.user;
		var auction = event.detail.auction;
		user.connect(app.guard(function(){
			addEventListeners(user, auction);
		}));
	}

	function addEventListeners(user, auction) {
		addNewPeerListener(user, auction);
		addVideoClickListener(auction);
		addPeerCallListeners(user);
		addExitListener(user);
	}

	function addNewPeerListener(user, auction) {
		auction.ref('users').on('child_changed', function(data){
			if (!user.video.stream) return;
			var model = data.val();
			if (model.id === user.model.id) return;
			if (!model.peer) return;
			if (model.peer === auction.user(model.id).model.peer) return;
			//console.log('detected change to', user.model.name, '@', user.model.peer);
			callUser(user, new User(model));
		});
	}

	function addVideoClickListener(auction) {
		document.addEventListener('click', function(e){
			if (!utils.matches(e.target, '.user video')) return;
			var source = e.target.parentNode.source;
			if (!source) throw new Error('unable to modify video without source');
			if (source.current) toggleStream(source, auction);
			else toggleMuted(source);
		});
	}

	function toggleMuted(user) {
		user.video.mute(!user.video.muted);
		utils.trigger(window, 'render');
	}

	function addExitListener(user) {
		window.addEventListener('beforeunload', function(){
			user.disconnect(app.guard());
		});
	}

	function connectCall(call, user) {
		call.on('stream', acceptStream(user));
		call.on('close', acceptStream(user));
		call.on('error', function(err){
			app.error(user.model.name + "'s connection is having issues: ", err.message || err);
		});
	}

	function addPeerCallListeners(user) {
		user.peer().on('call', function(call){
			var from = auction.peer(call.peer);
			//console.log('received call from', from.model.name, '@', from.model.peer);
			call.answer(user.video.stream || null);
			connectCall(call, from);
		}).on('error', function(err){
			var msg = err.message || err.toString();
			var match = msg.match(/connect to peer (\w+)$/);
			if (!match) app.error("your connection is having issues:", msg);
			else removePeer(match[1]);
		});
	}

	function removePeer(peer) {
		var user = auction.peer(peer);
		if (!user) return;
		delete user.model.peer;
		user.save(app.guard());
	}

	function toggleStream(user, auction) {
		if (user.video.stream) disconnectUserStream(user);
		else connectUserStream(user, auction);
	}

	function disconnectUserStream(user) {
		setStream(user, null);
	}

	function connectUserStream(user, auction) {
		navigator.getUserMedia(media, function(stream){
			setStream(user, stream);
			shareStream(user, auction);
		}, app.guard());
	}

	function setStream(user, stream) {
		if (!stream) user.video.unload();
		else user.video.load(stream);
		utils.trigger(window, 'render');
	}

	function shareStream(from, auction) {
		auction.users().forEach(function(to){
			if (!to.model.peer || from.model.peer === to.model.peer)
				return; // skip on self or not connected
			callUser(from, to);
		});
	}

	function callUser(from, to) {
		if (!to.model.peer) throw new Error('destination peer required');
		if (!from.connected()) throw new Error('source peer required');
		if (!from.video.stream) return new Error('source video stream missing');
		from.video.call = from.peer().call(to.model.peer, from.video.stream);
		//console.log('calling', to.model.name, '@', to.model.peer);
		connectCall(from.video.call, to);
	}

	function acceptStream(user) {
		return function(stream) {
			setStream(user, stream);
		}
	}

	window.addEventListener('ready', main);

})();