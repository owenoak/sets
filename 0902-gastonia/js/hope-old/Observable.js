
C$.defineMixin("Observable", {

	macros : {	"DebugTopic" : [ 
								{  flag : "observe" },
							  ]
			},

	props : {
		observe : function(method, callback, when, thisObject) {
			this.$debug.observe("observe(",method,",",callback,",",when,",",thisObject,")");
			
			// TOOD: I'd like to do callback.clone() here...
			thisObject = thisObject || this;
			var original = this[method],
				wrapper;
			if (!original) {
				wrapper = function() {
					callback.apply(thisObject, arguments);
				}
			} else {
				when = (when || "after");
				if (when == "before") {
					wrapper = function() {
						this.$debugNotify("notify(",method,",",callback,")");
						callback.apply(thisObject, arguments);
						return original.apply(this, arguments);
					}
				} else {
					wrapper = function() {
						this.$debugNotify("notify(",method,",",callback,")");
						var originalReturn = original.apply(this, arguments);
						callback.apply(thisObject, arguments);
						return originalReturn;
					}
				}
			}
			wrapper.__wrapped = original;
			return this;
		},
		
		// same as observe, but does a try catch around the callback
		observeSafely : function(method, callback, when, thisObject) {
			thisObject = thisObject || this;
			var tryWrapper = function() {
				try {	
					callback.apply(thisObject, arguments);
				} catch (e) {
					this.$errorObserve("notify(",method,",",callback,") failed with",e);
				}
			}
			return this.observe(method, tryWrapper, when, thisObject);
		},
		
		// DANGEROUS -- this will unwind past other observations if they were applied after callback
		// SHOULD BE ABLE TO FIX WITH WRAPPED AND WRAPPER?
		ignore : function(method, callback) {
			this.$debug.observe("ignore(",method,",",callback,")");
			if (!this[method]) return;
			var original = this[method];
			while (original.__wrapper && original.__wrapper != callback) {
				original = original.__wrapper;
			}

// TODO: use wrapped (and wrapper?) to restore if we're not the last in the chain?
			if (original.__wraped == callback) {
				this[method] = original;
			}
		}
	}

});