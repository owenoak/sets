hope.create({
	id : "EventHandler",
	superclass:"Mixin",
	
	// initialize the mixin
	initialize : function() {
		// global Element method to observe an event once,
		//	then unregister itself
		function observeOnce(element, eventName, handler, thisObject) {
			element = $(element);
			
			// create a function that unregisters itself
			var oneTimeHandler = function (event) {
				element.stopObserving(eventName, oneTimeHandler);
				return handler.call(thisObject, event);
			};
			if (thisObject) oneTimeHandler = oneTimeHandler.bindAsEventListener(thisObject);
			element.observe(eventName, oneTimeHandler);
		}


		// add to all elements
		Element.addMethods({
			observeOnce : observeOnce
		});
		
		// add to the document as well
		document.observeOnce = observeOnce.methodize();
	},
	
	methods : {
		hookupEvents : function(thisObject, element, handlers, skipDirectApplication) {
			thisObject = thisObject || this;
			element = (element ? $(element) : thisObject.$element);
			handlers = handlers || this.eventHandlers;
			if (!thisObject.__boundEvents) thisObject.__boundEvents = [];

			for (var eventName in handlers) {
				var handler = handlers[eventName].bindAsEventListener(thisObject);
				thisObject.__boundEvents.push( { element:element, eventName : eventName, handler:handler });

				element.observe(eventName, handler);

				// if this is being bound to us, register the event handler under the eventName
				//	so we can call it manually later
				if (skipDirectApplication != true) thisObject[eventName] = handler;
			}
		},
		
		removeEvents : function(fromElement) {
			if (!this.__boundEvents) return;
			this.__boundEvents.each(function(bound) {
				var element = bound.element;
				if (!element || !element.stopObserving) return;
				if (fromElement && element != fromElement) return;
				element.stopObserving(bound.eventName, bound.handler);
				if (this[bound.eventName] == bound.handler) delete this[bouund.eventName];
			});
		}
	}

});