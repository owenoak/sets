(function() {		// hide from global scope

	//
	// HTML attribute strings:		key="value" key="value"
	//
	
	// Convert an object to an HTML attribute format string.
	Object.toAttributeString = function(object) {
		return Object.toArray(object, "=", true).join(" ");
	};
	
	// Convert a string in HTML attribute format to an object.
	// If object is null, an empty object will be created.
	var attributeParser = /([\w-]+)\s*=\s*((['"])([^'"]+)\3|([\w_]+))/;
	String.prototype.parseAttributes = function(object) {
		if (!object) object = {};
	
		this.gsub(attributeParser, 
					function(match) {
						object[match[1]] = match[4] || match[5];
					});
		return object;
	};
	
	//
	// Query attribute strings:		key=value&key=value
	//
	
	// Convert an object to a query parameter format string.
	Object.toParameterString = function(object) {
		return Object.toArray(object, "=").join("&");
	};
	
	// Convert a string in query paramater format into an object.
	// If object is null, an empty object will be created.
	// NOTE: Prototype already has one of these, so we wrap that.
	String.prototype.parseParameters = function(object) {
		var results = this.toQueryParams();
		if (!object) return results;
		for (var key in results) object[key] = results[key];
		return object;
	};
	
	
	//
	// CSS Style strings:			key:value;key:value;
	//
	
	// Convert an object to a CSS style format string.
	Object.toStyleString = function(object) {
		return Object.toArray(object, ":").join(";");
	};
	
	var styleStringSplitter = /\s*;\s*/;
	var styleStringParser = /\s*([^:\s]*?)\s*:\s*(.*)/;
	// Convert a string in CSS style format into an object.
	String.prototype.parseStyles = function(object) {
		if (!object) object = {};
		
		var split = this.strip().split(styleStringSplitter);
		split.forEach(function(style) {
			style = style.match(styleStringParser);
			if (style) object[style[1]] = style[2];
		});
		return object;
	};
	

// TODO: split this into parser.chop?
// TODO: stick a method or two into the chopper to make it easier to iterate, eg?
// TODO: add nested flag to chop() ?
// TODO: pass a 'skipThisBit' thing into chopper so we can skip, eg,  #{...{}...}

	
	// Chop a string into pieces according to a pair of start and end regular expressions.
	// 	<start> and <end> are RegExps with the "g" flag set.
	//
	//	Returns an array of:
	//		- simple strings that are not between start/end token
	//		- for each start...end match, an object:
	//				{	middle : "...",
	//					start  : <result of start match>,
	//					end    : <result of end match>,
	//					nested : <boolean, true == there is a nested match inside middle>
	//				}
	//	If it can't match a start/end pair, logs error to console and returns undefined
	//
	String.prototype.chop = function(start, end) {
		var results = [], lastEnd = 0, match, endMatch, middle;

		start.lastIndex = end.lastIndex = 0;
		while (match = start.exec(this)) {
			if (lastEnd != match.index) results.push(this.substring(lastEnd, match.index));
			
			// advance the end past the start
			end.lastIndex = start.lastIndex;
			var nested = false, 
				endOfFirstStart = start.lastIndex, 
				endOfNestedStart = endOfFirstStart
			;
			while (endMatch = end.exec(this)) {
				middle = this.substring(endOfNestedStart, endMatch.index);
				// if we can't find another instance of start, stop here
				start.lastIndex = 0;
				if (!start.test(middle)) break;
				// otherwise notice that we're dealing with a nested tag and keep going
				nested = true;
				endOfNestedStart = endMatch.index
			}
			if (!endMatch) return console.error("chopOnExpressions(): can't match ",start," in string '",this,"'");
			results.push( {
							start  		: match,
							middle 		: this.substring(endOfFirstStart, endMatch.index),
							end    		: endMatch,
							nested 		: nested,
							startIndex	: match.index,
							endIndex	: endMatch.index + endMatch[0].length,
							source		: this
						 });
			lastEnd = start.lastIndex = end.lastIndex;
		}
		if (lastEnd != this.length) results.push(this.substr(lastEnd));

		// note the entire string the chop came from
		results.source = this;
		
		return results;
	}


		
	//
	//	Parse tags from HTML
	//


	String.prototype.chopOnTag = function(tagName) {
		return this.chop(Parser.getStartTagParser(tagName), Parser.getEndTagParser(tagName));
	};

	// Execute a callback for some string for each tag in the string
	//
	//	e.g. to find all <h1>-<h6> tags in document order, do this:
	//		document.body.innerHTML.forEachTag("h(\\d)", 
	//			function(it) { console.warn("h"+it.start[1]+":"+it.middle)}
	//		);
	//
	String.prototype.forEachTag = function(tagName, callback, callbackArgs, thisObject) {
		var chopped = this.chopOnTag(tagName), results = [];
		chopped.forEach(function(next) {
			if (typeof next == "string") return;
			if (thisObject) {
				results.push(callback.apply(thisObject, [next, callbackArgs]));
			} else {
				results.push(callback(next, callbackArgs));
			}
		});
		return results;
	}


	// Parse some XML, yielding an array of:
	//		- for matched tags, an object with:
	//			- .tagName
	//			- .attributes
	//			- .startIndex			start character index in the source string
	//			- .endIndex				end character index in the source string
	//			- .children				array of children from recursive call to Parser.parseTags
	//		- for text between tags, just returns a string
	//
	// This should handle nested tags OK.  Skips whitespace before/after tags.
	// NOTE: does NOT handle comments well -- 
	//			it just treats them as plain text, so nodes that are commented out will be wacky.
	String.prototype.parseTags = function (parseAttributes) {
		var genericStart = Parser.genericTagStartParser;
		var results = [], lastEnd = 0, match, endMatch, middle;
	
		genericStart.lastIndex = 0;
		while (match = genericStart.exec(this)) {
			if (lastEnd != match.index) {
				var string = this.substring(lastEnd, match.index).trim();
				if (string) {
					results.hasTextNode = true;
					results.push(string);
				}
//				console.info("found string "+results.last());
			}
			
			var nested = false, 
				isUnary = match[3] != "",
				attributes = match[2],
				result = {
					tagName : match[1],
					startIndex	: match.index,
					endIndex : genericStart.lastIndex
				},
				endOfFirstStart = genericStart.lastIndex, 
				endOfNestedStart = endOfFirstStart
			;
			if (attributes) {
				result.attributes = (parseAttributes ? attributes.parseAttributes() : attributes);
			}

			if (isUnary) {
//				console.info("matched unary tag ",match);
				lastEnd = genericStart.lastIndex;
			
			} else {
//				console.info("matched binary tag ",match);
	
				// get the start and end parsers for this tagName
				var end = Parser.getEndTagParser(result.tagName),
					start = Parser.getStartTagParser(result.tagName)
				;
				// advance the end past the start
				end.lastIndex = genericStart.lastIndex;
	
				while (endMatch = end.exec(this)) {
					middle = this.substring(endOfNestedStart, endMatch.index);
					// if we can't find another instance of start, stop here
					start.lastIndex = 0;
					if (!start.test(middle)) break;
					// otherwise notice that we're dealing with a nested tag and keep going
					nested = true;
					endOfNestedStart = endMatch.index
				}
				if (!endMatch) return console.error("parseTags(): can't match ",genericStart," in string '",this,"'");

				result.children = this.substring(endOfFirstStart, endMatch.index).parseTags(parseAttributes);
				result.endIndex	= endMatch.index + endMatch[0].length;
				lastEnd = genericStart.lastIndex = end.lastIndex;
			}
			results.push(result);
		}
		if (lastEnd != this.length) results.push(this.substr(lastEnd));
	
		// note the entire string the chop came from
		results.source = this;
		
		return results;
	}
	
	// Parse simple   function blah() {...}  blocks.
	//	Puts any comment before the function in with the function as its "prefix".
	//
	// NOTE: this is not particularly robust 
	//		-- it's basically just splitting by 		\n\s*function
	//			so it can be easily fooled.
	//
	String.prototype.parseFunctions = function(){
window.text = this;
		var functionParser = /^([ \t]*)function\s+(\w+)\(/gm,
			results = [],
			lastStart = 0
		;
		// find all of the functions
		while (match = functionParser.exec(this)) {
			results.push({
				name : match[2],
				body : null,
				start : match.index,
				end : 0,
				indent : match[1]
			});
		}
		var lastEnd = 0;
		for (var i = 0, result; result = results[i]; i++) {
			// get the stuff that comes before us
			result.prefix = (this.substring(lastEnd, result.start)).split("\n"+result.indent).join("\n");
			result.prefixStart = lastEnd;

			var nextStart = (i == results.length - 1 ? this.length : results[i+1].start);
			var body = this.substring(result.start, nextStart);

	// THIS IS TOTALLY LAME -- JUST LOOKS FOR THE LAST "}"... :-(
			lastEnd = result.end = (body.lastIndexOf("}") + result.start + 1);
			
			result.body = "\n" + this.substring(result.start, lastEnd);
			result.body = result.body.split("\n"+result.indent).join("\n").substring(1);
			
			// advance lastEnd past the newline
			lastEnd = this.indexOf("\n", lastEnd) + 1;
//			console.info(result.body);
		}
		return results;
	}



})();	// end hide from global scope


hope.create({
	id 			: "Parser",
	superclass 	: "Singleton",

	TagStartParsers : {},
	TagEndParsers : {},

	genericTagStartParser : /\s*<\s*([\w:]+)\s*([^>]*?)\s*(\/?)>\s*/ig,

	getStartTagParser : function (tagName) {
		return (    this.TagStartParsers[tagName] 
				 || (this.TagStartParsers[tagName] = new RegExp("\\s*<\\s*"+tagName+"\\s*([^>]*?)\\s*>\\s*","ig"))
			   );
	},

	getEndTagParser : function (tagName) {
		return (	this.TagEndParsers[tagName]
			     || (this.TagEndParsers[tagName] = new RegExp("\\s*<\\s*\\/\\s*"+tagName+"\\s*>\\s*","ig"))
			   );
	},

	
	parseFile : function(url) {
		var text = Loader.loadText(url);
		window.text = text;
		console.time("parse "+url);
		var results = text.parseTags(this.parseAttributes);
		console.timeEnd("parse "+url);

		results.source = text;
		Parser.forEach(results, function(it,indent){console.warn(indent,it)},"");
	},
	
	forEach : function(array, method, indent) {
		for (var i = 0; i < array.length; i++) {
			var next = array[i];
			method(next, indent);
			if (next.children) Parser.forEach(next.children, method, indent+"\t");
		}
	}

});
