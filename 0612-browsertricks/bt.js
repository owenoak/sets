var bt = {
	// summary:
	//	"bt" is the root of the BrowserTricks javascript framework.
	//	It is designed to be as small as possible and extremely quick.
	//	It is also possible to quickly "peer" or install a clone of the bt object
	//	in another frame or window, to allow you to load bt once in your top-level
	//	document, then use it in many different contexts without reloading.
	//
	//	Currently this only works in FireFox -- will likely break in other environments.
	//
	//	Note: make sure you always reference "bt.document" or "bt.window" in your code
	//	that uses bt to make sure that your code can be peered properly.

	mixin : function(obj) {
		// summary: Add all properties of arguments[1..n] to obj.
		//	obj				: (object) Object to add properties to.
		//	arguments[1..n]	: (object) 
		for (var i = 1, len = arguments.length; i < len; i++){
			var it = arguments[i];
			if (!it) continue;
			for (var prop in it) {
				obj[prop] = it[prop];
			}
		}
		return obj;
	},
	
	hitch : function(target, method) {
		// summary: Returns a function that explicitly calls target.method([arguments]).
		//	target	: (object) Object to use as "this" in the call.
		//	method	: (function) Method to call.
		return function() {
			method.apply(target,arguments);
		}
	},
	
	window : window,
	document : window.document,
	
	installInWindow : function(wd) {
		// summary: Install a clone of the bt object in another window,
		//			 setting its context up to operate in the window properly.
		// wd:		Pointer to window or iframe.
		// usage:	(in some other iframe)
		//			::bt.installInWindow(window);::
		if (!wd) return this.error("bt.installInWindow(null)","You must pass a window or iframe as argument");
		if (wd.bt) {
			this.warn("bt.installInWindow("+wd.location+")","bt is already installed");
		} else {
			// create the cloner function in the new window scope
			//	so the new bt object is also set in that scope
			with (wd) {
				var cloner = new wd.Function();
				cloner.prototype = this;
				wd.bt = new cloner();
			}
			if (wd.location) {
				// a window object			
				wd.bt.window = wd;
				wd.bt.document = wd.document;

			} else {
				// an iframe	-- FF only?
				wd.bt.window = wd;
				wd.bt.document = wd.contentDocument;
			}
		
			// grab all of the stylesheets from the main window and install them
			var origSheets = this.document.styleSheets,
				wdSheets = wd.bt.document.styleSheets
			;
			for (var i = 0, it; it = origSheets[i++];){
				var href = it.href;
				wd.bt.insertStyleSheet(href);
			}
			
			// clone any "_peerables" as well
			for (var name in this._peerables) {
				cloner.prototype = this._peerables[name];
				wd[name] = new cloner();
			}
		}
		top.it = wd.bt;
		return wd.bt;
	},
	_peerables : {},
	addPeerable : function(name, obj) {
		if (top._peerables[name] == null) {
			top._peerables[name] = obj;
		}
	},
	
	byId : function (id) {
		if (typeof id == "string") return this.document.getElementById(id);
		return id;
	},
	
	byTag : function(tag, which, parent) {
		// summary: Return element(s) by tag name.  
		//	Normal return is the entire tag collection.
		//	which?	: (string) id or (number) index of single element in collection to return.
		//  parent?	: (element) Pointer to element to look under.  If not specified, will use bt.document
		if (parent == null) parent = this.document;
		var list = parent.getElementsByTagName(tag);
		if (which == null) return list;
		if (typeof which == "string") {
			for (var i = 0, it; it = list[i++];) {
				if (it.id == which) return it;
			}
		} else if (typeof which == "number") {
			return list[which];
		}
		return this.error("bt.byTag("+tag+","+which+")","pass number or string as second arg");
	},
	
	childrenByTag : function(parent, tag, which) {
		return this.byTag(tag,which,parent);
	},
	
	
	getComputedStyle : function(id) {
		var el = this.byId(id);
		return this.window.getComputedStyle(el,"");
	},

	getComputedStyleProp : function(id, prop) {
		var style = this.getComputedStyle(id);
		if (style) return style[prop];
	},
	
	
	getDimension : function(el, prop, units) {
		// summary: Given an element and a property name, return the dimension according to units
		//			if units is passed, returns in relation to those units, no matter original units
		
		// TODO: take scrolling into account?
		el = this.byId(el);
		var value;
		switch (prop) {
			case "left" :	value = el.offsetLeft;	break;
			case "top"	: 	value = el.offsetTop;	break;
			default		:	value = this.getComputedStyleProp(el, prop);
		}
		if (value == null || value == '' || value == "auto") return 0;		// ???
		if (prop == "opacity") return value;
		var currentUnits = this.getUnits(value);

		value = parseInt(value);
		if (!units || !currentUnits || units == currentUnits) return value;
		
		// ok, we need to translate by the units
		switch (prop) {
			case "left":  case "right":  case "width":	
				var percentValue = bt.window.innerWidth;	break;
			case "top":  case "bottom":  case "height":	
				var percentValue = bt.window.innerHeight;	break;
			default:
				return value;
		}
		
		if (units == "%") return Math.floor((value / percentValue) * 100);
		return Math.floor(value * (percentValue / 100));
	},
	
	getUnits : function(value) {
		var pieces = (""+value).match(/(.*)(px|%)/);
		return (pieces ? pieces[2] : null);
	},
	
	listenByTag : function(tag, event, method, target) {
		// summary: Install event handlers for all elements with a given tag.
		//			Note: when method is called, "this" is the element the handler is assigned to.
		//	tag		: (string) Tag name to look for.
		//	event	: (string) Name of event ("click", "mouseover", etc).
		//	method	: (function) Method to hook up, or (string) script to execute
		//	target?	: (object) If present and method is function, we will attach hitch(target,method).
		var collection = this.byTag(tag);
		if (target && typeof method == "function") method = this.hitch(target,method);
		for (var i = 0, it; it = collection[i++];) {
			it.addEventListener(event, method, false);
		}
	},
	
	make : function(tag, parent, id, className, content, attributes, styles) {
		// summary: Create a new element and set its properties.
		//			If parent is specified, will be appended to parent's children
		//			You can also call by passing a single object parameter with same set of properties as arguments.
		//	tag			: (string) Tag name for element.
		//	parent?		: (element) Pointer to parent el, (string) id of parent el, or "body" to insert as top-level body element.
		//	id?			: (string) Id for element.
		//	className?	: (string) Class name(s) to apply to element
		//	content?	: (string) HTML for element.innerHTML, (array) list of elements to append as children, or (element) single element to append as child.
		//  attributes?	: (object) Object of key:value pairs to add as attributes of the element
		//	styles?		: (object) Object of key:value pairs to add to element.style (should be in js format, eg: "backgroundColor") 
		//	returns		: (element) Element that was created.
		if (typeof tag != "string" && arguments.length == 1) {
			var props = tag;
			tag = props.tag;
			parent = props.parent;
			id = props.id;
			className = props.className;
			content = props.content;
			attributes = props.attributes;
			styles = props.styles;
		}
		var el = this.document.createElement(tag);
		if (id != null) el.setAttribute("id",id);
		if (className != null) el.className = className;
		if (styles != null) {
			for (var prop in styles) {
				el.style[prop] = styles[prop];
			}
		}
		if (attributes != null) {
			for (var prop in attributes) {
				el.setAttribute(prop, attributes[prop]);
			}		
		}
		if (content != null) {
			if (typeof content == "string") {
				el.innerHTML = content;
			} else if (content.length) {
				for (var i = 0, it; it = content[i]; i++) {
					el.appendChild(it);
				}
			} else {
				el.appendChild(content);
			}
		}
		if (parent) {
			if (typeof parent == "string") {
				if (parent == "body") {
					parent = this.document.body;
				} else {
					parent = this.byId(parent);
				}
			}
			if (parent)	parent.appendChild(el);
		}
		return el;
	},
	
	insertStyleSheet : function(href) {
		this.make({tag:"link",parent:"body",attributes:{rel:"stylesheet",type:"text/css",href:href}})
	},
	
	
	show : function(id, effect) {
		this.fadeIn(id);
	},
	
	hide : function(id) {
		this.fadeOut(id);
	},
	
	toggle : function(id) {
		var el = this.byId(id);
		if (!el) this.error("bt.toggle("+id+")","element not found");
		if (this.getComputedStyleProp(el, "display") != "none") {
			this.hide(el);
		} else {
			this.show(el);
		}
	},
	
	fadeIn : function(el, totalTime) {
		// sumary: Fade the specified element in over totalTime.
		//	el			: (element) Element or (string) element.id to fade in.
		//	totalTime?	: (number:200) Time in milliseconds for effect.
		if (totalTime == null) totalTime = 200;
		var stepTime = Math.floor(totalTime / 10);
		
		el.style.opacity = 0;
		el.style.display = "block";
		var effect = function() {
			var opacity = parseFloat(el.style.opacity);
			if (opacity < .9) {
				el.style.opacity = (opacity + .1);
				setTimeout(effect,stepTime);
			} else {
				el.style.opacity = .99;
			}
		}
		effect();
	},
	
	fadeOut : function(el, totalTime) {
		// sumary: Fade the specified element out over totalTime.
		//	el			: (element) Element or (string) element.id to fade in.
		//	totalTime?	: (number:200) Time in milliseconds for effect.
		if (totalTime == null) totalTime = 200;
		var stepTime = Math.floor(totalTime / 10);
		
		el.style.opacity = .99;
		var effect = function() {
			var opacity = parseFloat(el.style.opacity);
			if (opacity > .1) {
				el.style.opacity = (opacity - .1);
				setTimeout(effect,stepTime);
			} else {
				el.style.opacity = 0;
				el.style.display = "none";
			}
		}
		effect();
	},

	
	// debug stuff
	debug : function(context) {
		console.info.apply(console,arguments);
	},
	warn : function(context) {
		console.warn.apply(console,arguments);
	},
	error : function(context) {
		console.error.apply(console, arguments);
		arguments.join = [].join;
		throw(arguments.join(" "));
	}


};

bt.toString = function() {
	var src = (this.window.location || this.window.src);
	return "[bt " + src +"]";
}




//
//
//	Quick/clean animation API
//
//	TODO:	- get linear working -- other effects?
//			- chaining
//			- colors
//			- total duration rather than stepDuration?
//
//


bt.Animation = function() {
	this.stepList = [];
	this.addSteps.apply(this, arguments);
console.log(this);
	if (this.autoPlay) this.play();
}


bt.Animation._makeStepList = function(el, prop, start, end, stepCount, stepFunction) {
	var units = bt.getUnits(end);
	var start = parseFloat(start || bt.getDimension(el, prop, units));
	var end = parseFloat(end);
	if (units == null) units = '';
	if (stepFunction == null) stepFunction = bt.Animation.easeInOut;
	
	var list = [];
	for (var i = 0; i < stepCount - 1; i++) {
		list[i] = stepFunction(i, stepCount, start, (end-start)) + units;
	}
	list[i] = end + units;
	return list;
}

bt.Animation.linear = function(stepNum, totalSteps, start, delta) {
	return ((stepNum / totalSteps) * delta) + start;
},

bt.Animation.easeInOut = function(stepNum, totalSteps, start, delta) {
	return (-delta / 2 * (Math.cos(Math.PI * stepNum / totalSteps) - 1) + start);
}

bt.Animation.prototype = {
	stepCount : 50,
	stepDuration : 15,
	units : "px",
	autoPlay : false,
	currentStep : 0,
	stepFunction : bt.Animation.easeInOut,

	addSteps : function() {
		for (var a = 0; a < arguments.length; a++) {
			var args = arguments[a],
				el, 
				list = []
			;

			for (var prop in args) {
				switch (prop) {
					case "el":  
					case "id":				el = bt.byId(args[prop]);			break;
					case "callback" : 		this.addCallback(args[prop]);		break;
					case "stepCallback" : 	this.addStepCallback(args[prop]);	break;
					case "autoPlay" :
					case "units" : 	
					case "stepList" :
					case "stepDuration" :
					case "stepFunction" :	
					case "stepCount":		this[prop] = args[prop];			break;
					default: 				list.push({prop:prop, end:args[prop]});
				}
			}
			for (var i = 0, it; it = list[i]; i++) {
				it.el = el;
				it.steps = bt.Animation._makeStepList(el, it.prop, it.start, it.end, this.stepCount, this.stepFunction);
				this.stepList.push(it);
			}
		}
	},

	addCallback : function(fn) {
		if (this.callbacks == null) this.callbacks = [fn];
		else this.callbacks.push(fn);
	},

	addStepCallback : function(fn) {
		if (this.stepCallbacks == null) this.stepCallbacks = [fn];
		else this.stepCallbacks.push(fn);
	},

	play : function() {
		this.currentStep = 0;
		this._execute();
	},

	reverse : function() {
		for (var i = 0, step; step = this.stepList[i]; i++) {
			step.steps.reverse();
		}
		this.play();
	},

	_execute : function() {
		for (var i = 0, item; item = this.stepList[i]; i++) {
			item.el.style[item.prop] = item.steps[this.currentStep];
		}
		if (this.stepCallbacks) {
			for (var i = 0, stepCallback; stepCallback = this.stepCallbacks[i]; i++) {
				stepCallback();
			}
		}
		if (++this.currentStep < this.stepCount) {
			var animation = this;
			setTimeout(function() {animation._execute()}, this.stepDuration);
		} else {
			if (this.callbacks) {
				for (var i = 0, callback; callback = this.callbacks[i]; i++) {
					callback();
				}
			}			
		}
	}
}
