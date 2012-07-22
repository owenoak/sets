//
//	Debuggable mixin -- declared as a full mixin after ClassFactory is loaded, below
//	
window.Debuggable = {
	id 			: "Debuggable",
	superclass 	: "Mixin",
	requires 	: "Cookie",
	
	applyTo : function(it) {
		for (var key in this.methods) {
			it[key] = this.methods[key];
		}
		if (it.globalRef) this.loadDebug(it);
	},

	methods : {
		setDebug : function(topic, level, skipSave) {
			if (topic == null) return;
			if (typeof topic == "object") {
				var map = topic;
				for (var key in map) this.setDebug(key, map[key], skipSave);
				return;
			}
			if (level == "true" || level == true) level = "debug";
			if (level == false || level == "false" || level == "off") level = undefined;

			if (!this._debugTopics) this._debugTopics = {};
			delete this.info[topic];
			delete this.debug[topic];
			delete this.warn[topic];
			delete this.error[topic];
			delete this._debugTopics[topic];
			switch(level) {
				case "debug":	this.debug[topic] = true;		// falls through
				case "info":	this.info[topic] = true;		// falls through
				case "warn":	this.warn[topic] = true;		// falls through
				case "error":	this.error[topic] = true;		// falls through
								this._debugTopics[topic] = level;
			}
			if (!skipSave) Debuggable.saveDebug(this);
		},
		debug : function(topic, level) {this.setDebug(topic, level != null ? level : "debug")},
		info : function(topic, level) {this.setDebug(topic, level != null ? level : "info")},
		warn  : function(topic, level) {this.setDebug(topic, level != null ? level : "warn")},
		error : function(topic, level) {this.setDebug(topic, level != null ? level : "error")}
	},

	saveDebug : function (it) {
		if (it.globalRef) Cookie.set(it.globalRef+".DebugTopics", it._debugTopics);
	},
	loadDebug : function (it) {
		if (!it.globalRef) return;
		var value = Cookie.get(it.globalRef + ".DebugTopics");
		// pass true to skip re-saving the cookie
		if (value) it.setDebug(value, null, true);
	}
};


// mix Debuggable into hope here manually
Debuggable.applyTo(hope);
