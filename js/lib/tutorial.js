(function(global){

	"use strict";

	var tutorial = { helper: document.querySelector('#helper') };
	if (tutorial.helper)
		tutorial.text = tutorial.helper.querySelector('.text');

	tutorial.toggleTarget = function callee(on, el) {
		var method = on ? 'add' : 'remove';
		var target = el || tutorial.target;
		target.classList[method]('tutorial-target');
		if (!target.parentNode.classList.contains('tutorial-subject'))
			callee(on, target.parentNode);
	};

	tutorial.render = function(step, done) {

		if (tutorial.target) tutorial.toggleTarget(false);
		if (step.target) tutorial.target = document.querySelector(step.target);
		else delete tutorial.target;
		if (tutorial.target) tutorial.toggleTarget(true);

		tutorial.text.classList.remove('visible');
		if (step.text) setTimeout(function(){
			tutorial.text.innerHTML = step.text;
			tutorial.text.classList.add('visible');
		}, 100);

		var offset = utils.centerScreenRelativeOffset(tutorial.target);
		tutorial.helper.style.top = offset.screenTop;
		tutorial.helper.style.left = offset.screenLeft;
		if (offset.left) tutorial.helper.classList.add('left');
		else tutorial.helper.classList.remove('left');
		if (offset.right) tutorial.helper.classList.add('right');
		else tutorial.helper.classList.remove('right');
		if (offset.above) tutorial.helper.classList.add('above');
		else tutorial.helper.classList.remove('above');
		if (offset.below) tutorial.helper.classList.add('below');
		else tutorial.helper.classList.remove('below');

		var event = step.event || 'click';
		var predicate = step.predicate || function() { return true; };
		utils.waitUntil(document.body, event, predicate, done);

	};

	tutorial.stop = function(done) {
		document.body.classList.remove('tutorial-mode');
		if (tutorial.target) utils.toggleTarget(tutorial.target, false);
		tutorial.helper.removeAttribute('style');
		if (done) done();
	};

	tutorial.start = function start(steps, done){
		setTimeout(function(){
			document.body.classList.add('tutorial-mode');
			if (!steps.length) return tutorial.stop(done);
			tutorial.render(steps[0], function(event){
				if (event.exit) tutorial.stop(done);
				else start(steps.slice(1), done);
			});
		}, 100);
	};

	global.tutorial = tutorial;

})(window);