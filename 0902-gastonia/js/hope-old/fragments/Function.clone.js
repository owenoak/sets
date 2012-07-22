	//  Clone a function (by returning a simple wrapper around it) 
	//
	//	Any arguments you pass to the clone() call will be permanently prefixed
	//	to all calls the the clone.
	//
	//	After the call,		clone.cloneOf == the original method
	//
	Function.prototype.clone = function() {
		var originalMethod = this, newMethod
		if (arguments.length == 0) {
			newMethod = function(){
				return originalMethod.apply(this, arguments)
			};
		} else {
			var clonedArgs = $A(arguments);
			newMethod = function(){
				return originalMethod.apply(this, clonedArgs.concat.apply(clonedArgs,arguments));
			}
		}
		newMethod.cloneOf = originalMethod;
		return newMethod;
	}

