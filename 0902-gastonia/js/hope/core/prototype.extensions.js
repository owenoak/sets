(function(){	// begin scope-hiding block


// make both "Webkit" and "WebKit" true since I can't get the capitalization right
Prototype.Browser.Webkit = Prototype.Browser.WebKit;


///////
//
//	JSON object (provided natively in cutting edge browsers)
//
///////
if (!window.JSON) {
	window.JSON = {
		parse : function(json) {
			var fn = new Function("return "+json);
			return fn();		
		},
		stringify : Object.toJSON
	}
}


// Make sure we have a window.JSON.parse() function.
//	Uses native implementation if defined.
if (!window.JSON) {
	window.JSON = {
		parse : function(json) {
			var fn = new Function("return "+json);
			return fn();
		}
	}
}




///////
//
//	Object extensions
//
///////

Object.extend(Object, {
	// Convert an object into an array of strings.
	//	<separator> (string? : "")		: Separator text to put between key/value pairs.
	//	<quotify>	(boolean? : false)	: If true, values will be quoted. 
	toArray : function(object, separator, quotify) {
		if (!separator) separator = "";
		var results = [], value
		for (var key in object) {
			value = (quotify ? '"'+ (""+object[key]).makeDoubleQuoteSafe() + '"' : object[key]);
			results.push(key + separator + value);
		}
		return results;
	}
});



///////
//
//	String extensions
//
///////

Object.extend(String.prototype, {
	makeQuoteSafe : function() {
		return this.replace("'","\\'").replace("\n","\\n");
	},

	makeDoubleQuoteSafe : function() {
		return this.split('"').join('\\"').split("\n").join("\\n");
	},
	trim : function() {
		return this.replace(/^\s+/, '').replace(/\s+$/, '');
	}
	
});

///////
//
//	Function extensions
//
///////


// fix Prototype's broken argumentNames implementation
var argParser = /^[\s\(]*function[^(]*\(\s*([^\)]*?)\s*\)/;
var argSplitter = /\s*,\s*/;
Function.prototype.argumentNames = function() {
	var string = Function.prototype.toString.apply(this);
	var names = string.match(argParser)[1].split(argSplitter);
	return names.length == 1 && !names[0] ? [] : names;		// no args returns []
}


///////
//
//	Array extensions
//
///////

// If native Array.prototype extensions were grabbed before Prototype loaded,
//	install them now (over prototype's less efficient versions).
if (Loader.arrayExtensions) {
	for (var key in Loader.arrayExtensions) {
		Array.prototype[key] = Loader.arrayExtensions[key];
	}
}
// make sure forEach is present as well
if (!Array.prototype.forEach) Array.prototype.forEach = Array.prototype.each;


Object.extend(Array.prototype, {
	// add an execute method to all arrays which executes each item 
	// arguments passed in will be sent to the function
	execute : function() {
		for (var i = 0, len = this.length; i < len; i++) {
			var method = this[i];
			if (typeof method == "function") method.apply(window, arguments);
		}
	},
	
	// tries to execute all functions in an array with arguments (all but first argument)
	//	if there is an error with any of the functions
	//		if you pass a string message as the first arg, it log the message to the console and re-throw the error
	//		if you pass a null message, any errors will be swallowed
	tryExecuting : function(message) {
		var args = $A(arguments);
		args.shift();
		for (var i = 0, len = this.length; i < len; i++) {
			var method = this[i];
			try {
				if (typeof method == "function") method.apply(window, args);
			} catch (e) {
				if (message != null) {
					console.error(message);
					throw e;
				}
			}
		}
	},
	
	// merge the (list) arguments into this array, affecting this array (and returning it)
	//	if argument is null or empty array, skipped
	//	if argument is array, added individually to the end of this array
	//	else	added to the end of this array
	merge : function() {
		for (var i = 0, len = arguments.length, list; i < len; i++) {
			if (! (list = arguments[i]) ) continue;
			if (!Object.isArray(list)) this.push(list);
			else if (list.length) this.push.apply(this, list);
		}
		return this;
	}
});


///////
//
//	Number extensions
//
///////

$w('max min').each(function(method){
  Number.prototype[method] = Math[method].methodize();
});



///////
//
//	Document extensions
//
///////

Object.extend(document, {
	// append an element to the head tag (or the HTML tag if head is not defined)
	appendToHead : function(element) {
		($$("HEAD")[0] || $$("HTML")[0]).appendChild(element);
	}
});


///////
//
//	Element extensions
//
///////

// patch the getStyle method which returns the wrong value for right and bottom
var originalGetStyle = Element.Methods.getStyle;
Element.addMethods({
	getStyle : function(element, style) {
		element = $(element);
		if (style == "right")  return element.getWidth()  + parseInt(element.getStyle("left")) + "px";
		if (style == "bottom") return element.getHeight() + parseInt(element.getStyle("top")) + "px";
		return originalGetStyle(element, style);
	}
});


Element.addMethods({
	// return the first matching sub element for a selector
	selectOne : function(element, selector, selector2, etc) {
		var args = $A(arguments);
		return Element.select.apply(element, args)[0];
	}
});





})();	// end scope-hiding block
