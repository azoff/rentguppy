(function(global){

	"use strict";

	var registry = {};
	var templates = {};

	templates.register = function(name, html) {
		registry[name] = html;
	};

	templates.html = function(name) {
		if (name in registry)
			return registry[name];
		else return name;
	};

	templates.render = function(name, model) {
		var html = templates.html(name);
		var rexp = /\{\{\s*(.+?)\s*\}\}/g;
		return html.replace(rexp, function(_, keypath){
			return utils.valueAtPath(model, keypath, "");
		});
	};

	templates.renderNode = function(name, model) {
		var temp = document.createElement('div');
		temp.innerHTML = templates.render(name, model);
		return Array.prototype.shift.call(temp.childNodes);
	};

	global.templates = templates;

})(window);