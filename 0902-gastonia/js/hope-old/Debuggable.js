
//	Debugging semantics
//
//	Apply hope.Debuggable to your object (or prototype) to create debugging semantics:
//							hope.Debuggable.applyTo( it );
//
// 	We have three error levels:
//		"debug", "warn" and "error"
//
//	Create debug topics for things that you want to debug
//		individually:		it.setDebug( <topic>, <level> )
//		or en masse: 		it.setDebug( { <topic>: <level>, <topic>: <level> } )
//	
//		where levels are:
//				- "off" or false			- turn all off
//				- null or true or "debug"	- "debug" level
//				- "warn"					- "warn" level
//				- "error"					- "error" level
//
//	You can also clear debugging for a particular topic with
//							it.clearDebug( <topic> )
//
//
//	Then when you want to debug something, do this:
//
//			(this.debug.create && console.debug(this+"create", "blah","blah","blah"))
//	or
//			if (this.warn.create) {
//				...
//				console.warn(this+"create", "blah","blah","blah");
//			}
//
//	If you want to hard-code a set of debug topics, have a DebugTopic object in your object
//	 before Debuggable is applied to it.
//	
//	If your object has a globalRef defined when Debuggable is applied to it,
//	 we will load debug topics stored in a cookie and apply those to the object 
//	(after the static topics are applied).
//
ClassFactory.create({
	id : "Debuggable",
	superclass : "Mixin",
	requires : "Cookie",
	
	initialize : function() {
		Debuggable.applyTo(hope);
	},
	
	applyTo : function(it) {
		hope.extend(it, hope.Debuggable.methods);

		var initialTopics;
		// pick up any DebugTopics set statically
		if (it.hasOwnProperty("DebugTopics") && !it.debug) {
			var initialTopics = it.DebugTopics;
			delete it.DebugTopics;
		}

		hope.Debuggable.initDebugTopics(it);

		if (initialTopics) it.setDebug(initialTopics);
		
		// now pick up any debug topics from the cookie
		hope.Debuggable.loadDebugTopics(it);
	},

	// methods we actually put on the object
	methods : {
		setDebug : function(topic, skipSave) {
			if (typeof topic == "object")  {
				hope.Debuggable.setDebugMap(this, topic);
			} else if (typeof topic == "string") {
				hope.Debuggable.setDebugTopic(this, topic, skipSave);
				skipSave = arguments[2];
			} else {
				throw("setDebug(",topic,",",skipSave,"): first argument must be a string or object");
			}
			if (skipSave != true) hope.Debuggable.saveDebugTopics(this);
		},
		
		clearDebug : function(topic) {
			this.setDebug(topic, "off");
		}
	},

	setDebugMap : function(it, map) {
		if (!map) return;
		for (var key in map) {
			this.setDebugTopic(it, key, map[key]);
		}
	},
	
	setDebugTopic : function(it, topic, level) {
		if (!topic) return;
		
		// make sure object has own "DebugTopics", "debug", "error" and "warn" objects
		if (!it.hasOwnProperty("DebugTopics")) hope.Debuggable.initDebugTopics(it);

		var map = it.DebugTopics;
		
		if (level == null || level == "true" || level == true) level = "debug";
		if (level == false) level = undefined;

		// clear everything out
		delete it.DebugTopics[topic];
		delete it.debug[topic];
		delete it.warn[topic];
		delete it.error[topic];

		if (level) {
			switch (level) {
				case "debug":
					it.debug[topic] = true;
					// debug will fall through to warn and error as well
					
				case "warn":
					it.warn[topic] = true;
					// warn will fall through to error

				case "error":
					it.error[topic] = true;
					it.DebugTopics[topic] = level;
			}
		}
	},
	
	// Initialize debugTopics for an object
	//	if we have a superclass which is already debuggable, 
	//		make our DebugTopics, etc protoclones of it.
	//  Otherwise our DebugTopics will be based on the hope.DebugTopics
	initDebugTopics : function(it) {
		if (it == hope) return;

		var proto = it.constructor.prototype;
		if (!proto.DebugTopics) proto = hope;

		it.DebugTopics = hope.protoClone(proto.DebugTopics);
		it.debug = hope.protoClone(proto.debug);
		it.warn = hope.protoClone(proto.warn);
		it.error = hope.protoClone(proto.error);
	},

	loadDebugTopics : function(it) {
		if (!it.globalRef) return;
		var map = Cookie.get(it.globalRef + ".DebugTopics");
		hope.Debuggable.setDebugMap(it, map);
	},
	
	saveDebugTopics : function(it) {
		if (!it.globalRef || !it.DebugTopics) return;
		Cookie.set(it.globalRef + ".DebugTopics", it.DebugTopics);
	}
});	// end create(Debuggable)
