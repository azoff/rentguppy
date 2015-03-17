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
		addNewPeerListener(user, auction);
		addPeerCallListeners(user);
		addExitListener(user);
	}

	function addNewPeerListener(user, auction) {
		auction.ref('users').on('child_added', function(data){
			var added = new User(data.val());
			if (!user.video.stream) return;
			if (user.model.id === added.model.id) return;
			callUser(user, added);
		});
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
			user.disconnect(app.guard());
		});
	}

	function connectCall(call, user) {
		user.video.call = call;
		call.on('stream', acceptStream(user));
		call.on('close', acceptStream(user));
		call.on('error', function(err){
			app.error(user.model.name + "'s connection is having issues: ", err.message || err);
		});
	}

	function addPeerCallListeners(user) {
		user.peer.on('call', function(call){
			var from = auction.peer(call.peer);
			console.log('received call from', from.model.name);
			call.answer(user.video.stream || null);
			connectCall(call, from);
		});
		user.peer.on('error', function(err){
			app.error("your connection is having issues: ", err.message || err);
		});
	}

	function toggleStream(user, auction) {
		if (user.video.stream) disconnectUserStream(user);
		else connectUserStream(user, auction);
	}

	function disconnectUserStream(user) {
		setStream(user, null);
	}

	function connectUserStream(user, auction) {
		navigator.getUserMedia({ video: true }, function(stream){
			setStream(user, stream);
			shareStream(user, auction);
		}, app.guard());
	}

	function setStream(user, stream) {
		if (!stream) user.video.destroy();
		else user.video.create(stream);
		utils.trigger(window, 'render');
	}

	function shareStream(from, auction) {
		auction.users().forEach(function(to){
			if (!from.model.peer) return;
			if (from.model.id === to.model.id) return;
			callUser(from, to);
		});
	}

	function callUser(from, to) {
		var call = from.peer.call(to.model.peer, from.video.stream);
		connectCall(call, to);
	}

	function acceptStream(user) {
		return function(stream) {
			setStream(user, stream);
		}
	}

	window.addEventListener('ready', main);

})();