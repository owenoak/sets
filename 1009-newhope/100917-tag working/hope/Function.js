/*** Function extensions ***/

(function() {
Function.toRef = function(){ return "Function" };

var _slice = Array.prototype.slice;
var _concat = Array.prototype.concat;

// Define function.bind() as per ES5 spec (more or less)
// NOTE: this does NOT work for binding a constructor for use with `new`.
if (!Function.prototype.bind) {
	Function.prototype.bind = function(scope, arg1, arg2, etc) {
		var method = this;
		// convert arguments 1...n to real array
		var boundArgs = (arguments.length > 1 ? _slice.call(arguments, 1) : null);
		return function bound(){ 
			var args = (boundArgs ? _concat.apply(boundArgs, arguments) : arguments);
			return method.apply(scope, args)
		}
	}
}



//! Execute this method for each item in @set (either an array or object), passing bound arguments.
//  Each item in set is first argument. (UMMM....)
//	Returns array of results (if passed array) or map of results (if passed object).
Function.prototype.each = function(set, arg1, arg2, etc) {
	if (typeof set != "object") return;
	var args = $args(), results;
	if (set.length) {
		results = [];
		for (var i = 0, l = set.length; i < l; i++) {
			args[0] = set[i];
			results[i] = this.apply(set[i], args);
		}
	} else {
		results = {};
		for (var key in set) {
			args[0] = set[key];
			results[key] = this.apply(set[key], args);
		}	
	}
	return results;
}


Script.loaded("{{hope}}Function.js");
})();// end hiden from global scope
