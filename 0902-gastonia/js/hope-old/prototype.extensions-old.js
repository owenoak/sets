



Object.extend(Ajax, 
{
	debugInclude : false,
	
	// Include a script file and perform callback when it is complete
	//
	// TODO: allow them to pass a callback
	// TODO: allow multiple paths (and perform callback once when all are loaded)
	// TODO: how to know if we got a 404?
	//			wait a bit and check the script.innerHTML for string "404"  ???
	includeScript : function(path, immediate) {
		var callback;
		
		// NOTE: this is not safe!
		//	the script may be present but not completed yet...
		if (Ajax.pathAlreadyLoaded("script", path)) {
if (Ajax.debugInclude) console.info("<<<< includeScript:  ",path," is already loaded <<<<");
			return true;
		}

if (Ajax.debugInclude) {
	console.info(">>>> loading ",path, " >>>>");
	callback = function(){console.info("<<<< done loading ",path,"<<<<")};
}

		if (immediate == true) {
			function errback(request, error) {
				console.error("**** Error loading '"+path+"': ", e);
			}
			
			new Ajax.Request(path, {
				method : "GET",
				asynchronous : false,
				onException : errback,
				onFailure : errback,
				onSuccess : function loadSucceeded(request, evalJS) {
					try {
						var script = request.responseText;
						eval(script);
						if (callback) callback();
					} catch (e) {
						errback(null, e);
					}
				}
			});
		
		} else {
			try {
				var script = new Element("script", {src:path, type:"text/javascript"});
				if (callback) {
					if (Prototype.Browser.IE) {
						script.onreadystatechange = function readyStateChange() {
							if (script.readyState == "loaded" || script.readyState == "complete") {
								callback();
							}
						}
					} else {
						script.onload = callback;
					}
				}
				($$("HEAD")[0] || $$("HTML")[0]).appendChild(script);
			} catch (e) {
				errback(null, e);
			}
		}
		return false;
	},

	// return a tag with a particular src
	tagForSrc : function(tag, path, exact) {
		if (exact == true) {
			return $$(tag+"[src="+path+"]")[0];
		} else {
			return $$(tag+"[src*="+path+"]")[0];
		}
	},

	// NOTE: this is not reliable
	//	-- need a way to tell if a script has already finished loading
	pathAlreadyLoaded : function(tag, path) {
		return this.tagForSrc(tag, path) != null;
	},


	// TODO: get a single URL which parses any kind of path ?
	PATH_URL : /(.*\/)[^\/]+?/,
	LEAF_URL : /.*\/([^\/]*)/,
	
	// return the path (everything before the leaf file name)
	//	for a url or an element with a 'src' parameter
	getPath : function(what) {
		if (!what) return "";
		if (what.getAttribute) what = what.getAttribute("src") || "";
		var match = what.match(Ajax.PATH_URL);
		return (match ? match[1] : "");
	},
	
	// return the leaf file name 
	//	for a url or an element with a 'src' parameter
	getFile : function(what) {
		if (!what) return "";
		if (what.getAttribute) what = what.getAttribute("src") || "";

		// strip off any parameters or hash first
		var endIndex = what.search(/[\?#]/);
		if (endIndex != -1) what = what.substr(0, endIndex);
		var match = what.match(Ajax.LEAF_URL);
		return (match ? match[1] : what);
	},
	
	// return the leaf file name WITHOUT its extension
	//	for a url or an element with a 'src' parameter
	getFileNoExtension : function(what) {
		var file = Ajax.getFile(what),
			index = file.indexOf(".")
		;
		if (index == -1) return file;
		return file.substr(0, index);
	}
}
);




//
//	Extend strings so we can use them as expanders in a performant way
//
String.prototype.interpolate = function(thisObject, pattern) {
	var template;
	if (pattern == null) {
		// SHORT CUT: if the pattern is not in the string, don't bother
		// NOTE:  ""+this is necessary to convert to a simple string (otherwise returns as a String)
		if (this.indexOf("#{") == -1) return ""+this;
		template = (Template._registry[this] || (Template._registry[this] = new Template(this)));
	} else {
		template = new Template(this);
	}
	return template.evaluate(thisObject, pattern);
}
Template._registry = {};

// alias for "string.include" to be proper english
String.prototype.includes = String.prototype.include;
String.prototype.contains = String.prototype.include;


//
//	Template extensions
//

// create a template from the contents of an HTML object on the page
//	(and remove the outer template element from the page)
Template.createFromHTML = function(id) {
	if (Template._registry[id]) return Template._registry[id];
	
	var element = $(id);
	if (!element) return;
	var template = new Template(element.innerHTML);
	element.remove();

	Template._registry[id] = template;
	return template;
}

//
//	Cookie object for getting/setting/examining cookies
//
var Cookie = {
	get : function(name) {
		if (!document.cookie) return undefined;
		var cookies = document.cookie.split("; ");	// TODO: cross browser?
		for (var i = 0, len = cookies.length; i < len; i++) {
			var cookie = cookies[i].split("=");
			if (cookie[0] == name) return unescape(cookie[1]);
		}
		return undefined;
	},
	
	set : function(name, value, path, domain, expires, secure) {
		var newCookie = name + "=" + escape(value) +
				((expires) ? "; expires=" + expires.toGMTString() : "") +
				((path) ? "; path=" + path : "") +
				((domain) ? "; domain=" + domain : "") +
				((secure) ? "; secure" : "")
		;

		document.cookie = newCookie;
		return Cookie.get(name);
	},
	
	clear : function(name, path, domain) {
		if (!Cookie.get(name)) return;
		return Cookie.set(name, "", path, domain, new Date(0));
	},

	//
	//	return all of the current cookies as a map (object)
	//
	map : function() {
		var map = {};
		if (!document.cookie) return {};
		var cookies = document.cookie.split("; ");
		for (var i = 0, len = cookies.length; i < len; i++) {
			var cookie = cookies[i].split("=");
			map[cookie[0]] = unescape(cookie[1]);
		}
		return map;
	},

	//
	//	one cookie with multiple 'values'
	//
	
	_valuesFor : function(name) {
		var values = Cookie.get(name);
		if (!values) return [];
		return values.split("|").compact();
	},

	_setValuesFor : function(name, valueList, path, domain) {
		var value = valueList.join("|");
		if (!value) return Cookie.clear(name, path, domain);
		return Cookie.set(name, value, path, domain);
	},
	
	addValue : function(name, value, path, domain) {
		var values = Cookie._valuesFor(name);
		if (values.indexOf(value) != -1) return Cookie.get(name);
		values.push(value);
		return Cookie._setValuesFor(name, values, path, domain);
	},
	
	removeValue : function(name, value, path, domain) {
		var values = Cookie._valuesFor(name),
			index = values.indexOf(value)
		;
		if (index == -1) return Cookie.get(name);
		cookie.splice(index, 1);
		return Cookie._setValuesFor(name, values, path, domain);
	},
	
	hasValue : function(name, value) {
		var values = Cookie._valuesFor(name);
		return (values.indexOf(value) > -1);
	},
	
	// pass one or more values:
	//	if value is preceeded by "+", we will always add
	//	if value is preceeded by "-", we will always remove
	//	otherwise, we will add if present, remove if not present
	toggleValues : function(name, newValues, path, domain) {
		var values = Cookie._valuesFor(name);
		for (var i = 0; i < newValues.length; i++) {
			var value = newValues[i],
				adding = undefined,
				removing = undefined
			;
			if (value.charAt(0) == "+") {
				value = value.substr(1);
				adding = true;
			} else if (value.charAt(0) == "-") {
				removing = true;
				value = value.substr(1);
			}
			var index = values.indexOf(value);
			if (!adding && !removing) {
				adding = (index == - 1);
				removing = !adding;
			}
			if (adding && index == -1) values.push(value);
			if (removing && index > -1) values.splice(index, 1);
		}
		return Cookie._setValuesFor(name, values, path, domain);
	}
};
// set up aliases for a couple of functions
Cookie.setValue = Cookie.addValue;
Cookie.clearValue = Cookie.removeValue;




// Class: Date
//	Extensions to the Date object

var DateTranslations = {
	MSEC_IN_ONE_DAY : 24 * 60 * 60 * 1000,
	
	// WARNING: english only!
	//	TODO: figure out abbrevs at least from clever parsing of a date object toString?
	MONTH_NAMES 	: $w("January February March April May June July August September October November December"),
	MONTH_ABBREVS 	: $w("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec"),

	DAY_NAMES		: $w("Sunday Monday Tuesday Wednesday Thursday Friday Saturday"),
	DAY_ABBREVS		: $w("Sun Mon Tue Wed Thu Fri Sat"),
	DAY_INITIALS	: $w("S M T W T F S"),

	timezoneRegExp : /(\d*:\d*:\d*).*\((.*)\)$/
}
Object.extend(Date, DateTranslations);
Object.extend(Date.prototype, DateTranslations);

Object.extend(Date.prototype, {
	clone : function() {
		return new Date(this);
	},

	getMonthName : function(abbreviate) {
		if (abbreviate) return Date.MONTH_ABBREVS[this.getMonth()];
		return Date.MONTH_NAMES[this.getMonth()];
	},

	getDayName : function(abbreviate) {
		if (abbreviate) return Date.DAY_ABBREVS[this.getDay()];
		return Date.DAY_NAMES[this.getDay()];
	},

	//  Method: toTimezoneString
	//	Return the timezone string from this date.
	//	WARNING: this is likely to *not* work in languages other than US english.
	toTimezoneString : function() {
		var match = this.toTimeString().match(this.timezoneRegExp);
		if (match) return match[2];
	},
	
	//	WARNING: this is likely to *not* work in languages other than US english.
	toPrettyTimeString : function() {
		var time = this.toTimeString(),
			match = time.match(this.timezoneRegExp)
		;
		if (match) return match[1] + " " + match[2];
		return time;
	},
	
	//  Method: toPrettyString
	//	Return a pretty string version of this date.
	toPrettyString : function() {
		return this.toDateString() + " &bull; " + this.toPrettyTimeString();
	},

	// add the specified # of days (positive or negative) to the date, preserving the time
	// NOTE: this DOES work around daylight savings time
	addDays : function(days) {
		// remember hours and minutes so we can reset them
		//	in case we're crossing a daylight savings boundary
		var startHours = this.getHours(),
			startMinutes = this.getMinutes()
		;
		this.setHours(12);	
		this.setTime(this.getTime() + (days * this.MSEC_IN_ONE_DAY));
		// reset to stored hours/mins
		this.setHours(startHours);
		this.setMinutes(startMinutes);
		return this;
	}
});



//
//	Class: Number
//	Extensions to all numbers
Number.prototype.toBytesString = function() {
	var powersOfTen = ["","Kb", "Mb", "Gb", "Tb", "Pb", "Xb", "Zb", "Yb"];
	var it = this,
		power = 0
	;
	while (it >= 1024) {
		it = it/1024;
		power++;
	}
	if (power) {
		it = Math.round(it * 100) / 100;
		return it + " "+powersOfTen[power];
	}
	return ""+this;
}



// Extension to element to take a bunch of HTML and convert it to elements
//	(in a document fragment) and returns pointers to the elements
// NOTE: like most prototype DOM functions, this only returns elements,
//			ignoring top-level text nodes.  :-(
//
//	TODO: is there a better way to do this in Prototype?
Element.htmlToElements = function(html) {
	var wrapper = Element.extend(document.createElement("div"));
	wrapper.innerHTML = html;
	return wrapper.childElements();
}


// Extensions to document.viewport
//
//	Get the maximzed dimensions for the viewport 
//	 similar to d.v.getDimensions() but it will extend the dimensions to the
//	 entire browser window if the viewport doesn't fill the entire window.
document.viewport.getMaxedDimensions = function() {
	var dims = document.viewport.getDimensions();
	dims.width = Math.max(dims.width, window.innerWidth);
	dims.height = Math.max(dims.height, window.innerHeight);
	return dims;
}


//	Additional methods added to all elements
//
Element.addMethods({
	toggleClassNames : function(element, names) {
		if (typeof names == "string") names = $w(names);
		for (var i = 0; i < names.length; i++) {
			var name = names[i];
			if (typeof name != "string") continue;
			
			if (name.charAt(0) == "+") {
				name = name.substr(1);
				element.addClassName(name);
			} else if (name.charAt(0) == "-") {
				name = name.substr(1);
				element.removeClassName(name);
			} else {
				if (element.hasClassName(name)) {
					element.removeClassName(name);
				} else {
					element.addClassName(name);
				}
			}
		}
	},

	bringToFront : function(element) {
		element.style.zIndex = Element.MAX_Z_INDEX++;
	},
	
	getPositionedCoordinates : function(element) {
		return element._getCoordinates(element.positionedOffset());
	},

	getCumulativeCoordinates : function(element) {
		return element._getCoordinates(element.cumulativeOffset());
	},

	getViewportCoordinates : function(element) {
		return element._getCoordinates(element.viewportOffset());
	},
	_getCoordinates : function(element, offset) {
		var dims = element.getDimensions();
		dims.left = offset.left;
		dims.right = dims.left + dims.width;
		dims.top = offset.top;
		dims.bottom = dims.top + dims.height;
		return dims;
	},

	// NOTE: assues element and sourceElement are in the same coordinate space
	//			(i.e. they have the same parentElement) 
	//		 and that element is already position:absolute
	locateNear : function($element, $source, location, event) {
		if (location == null) location = "SW";
		else location = location.toUpperCase();

		var left = 0,
			top = 0,
			element = $element.getDimensions(),
			source = ($source ? $source.getCumulativeCoordinates() : {left:0,top:0,width:0,height:0})
		;
		if (location == "MOUSE") {
			

		} else { 	// N,S,E,W
			if (location.includes("S")) {
				top = source.bottom;
			} else if (location.includes("N")) {
				top = source.top - element.height;
			} else {
				top = source.top + (source.height / 2) - (element.height / 2);
			}
	
			 if (location.includes("E")) {
				left = source.right - element.width;
			} else if (location.includes("W")) {
				left = source.left;
			} else {
				left = source.left + (source.width / 2) - (element.width / 2);
			}
		}

		// make sure that it fits within the window
		var viewport = document.viewport.getMaxedDimensions();
		//	 TODO: take scroll into account?
		if (top + element.height > viewport.height) {
			top = viewport.height - element.height;
		}
		if (top < 0) top = 0;
		
		if (left + element.width > viewport.width) {
			left = viewport.width - element.width;
		}
		if (left < 0) left = 0;
		
		// now convert from cumulative to local coords
		var sourceLocal = $source.positionedOffset();		// TODO: viewportOffset?
		left += (sourceLocal.left - source.left);
		top += (sourceLocal.top - source.top);
		
		$element.style.left = left + "px";
		$element.style.top = top + "px";
	}

});
Element.MAX_Z_INDEX = 1000000;





/** Form Element Extensions **/

Object.extend(Form, 
{
	setUpFieldHints : function(parentElement) {
		var elements = $(parentElement).select(".HintField");
		elements.each(function(element) {
			Form.setUpFieldHint(element);
		});
	},

	setUpFieldHint : function(element) {
		if (!element.hasClassName) element = $(element);

		function focusHint(event) {
			var hint = element.getHint();
			if (!hint) return;
			
			if (element.getValue() == hint) {
				element.value = "";
				element.removeClassName("Hint");
			}
		}
	
	 	function blurHint(event) {
			var hint = element.getHint();
			if (!hint) return;
			
			if (element.getValue() == "") {
				element.value = hint;
				element.addClassName("Hint");
			}
		}

		element.observe("focus", focusHint);
		element.observe("blur",  blurHint);
		
		element.showHint = blurHint;
		element.showHint();
	}	
});

Element.addMethods({
	getHint : function(element) {
		return element.getAttribute("hint");
	}
});


//
//	Ajax utility stuff
//
Ajax.encodeUriParameters = function(params) {
	var output = [];
	for (var prop in params) {
		output.push(prop + "=" + encodeURI(params[prop]));
	}
	return output.join("&");
}



