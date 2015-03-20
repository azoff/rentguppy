(function(){

	"use strict";

	var user = User.current();
	if (user.model.seenTutorial) return;
	user.model.seenTutorial = true;
	user.cache();

	window.addEventListener('ready', function(){
		tutorial.start([{
			text: 'Welcome to <strong>RentGuppy</strong>! My name is Gunther, and I\'ll be ' +
			'showing you around the auction house. Click anywhere to continue.'
		},{
			text: 'This is the name of the auction. You can rename it to the name of your house,' +
			' so everyone knows what you\'re bidding on!',
			target: '#auction-name'
		},{
			text: 'Here\'s a list of roommates (this one is you!). If you want to change your name, you can do it here.' +
			' For extra flair, click the circle to share your video feed!',
			target: '#roommates .user[data-current=true]'
		},{
			text: 'These are the rooms in your house. You can rename them so that you\'re roommates know which is which.',
			target: '#rooms .room h3'
		},{
			text: 'You can bid on each room, and the top bid will show up as the price of the room.',
			target: '#rooms .room form'
		},{
			text: 'Each bid contributes to the remaining value of the house. Adjust your bids and the house total to ' +
			'find a price that everyone can agree with.',
			target: '.rent.total'
		},{
			text: 'That\'s it! Best way to learn is to jump right in. Best of luck and happy bidding!'
		}]);
	});

})();