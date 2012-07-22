/* TODO:   handle an <include src=''/> 	*/

hope.create({
	id 				: "XMLParser",
	superclass 		: "BaseClass",
	mixins			: "Debuggable",

	defaults : {
		parseAttributes : true,				// if true, we will convert any attributes found into objects automatically
		infoString : "",
		opaqueTagMap		: { "script":1 }	// when we get one of these in parseTags, we don't go any deeper
	},
	
	methods : {
		initialize : function(properties) {
window.parser = this;
			if (typeof properties == "string") 	this.setUrl(properties);
			else								this.extend(properties);
			if (this.url) this.parseUrl();
		},
		
		setUrl : function(url) {
			this.url = url;
		},
		
		parseUrl : function() {
			this.infoString = "from "+this.url;
			this.text = Loader.loadText(this.url);
			this.parse();
		},
		
		parse : function(text) {
			if (text) this.text = text;
			console.time("parse xml from "+this.url);
			this.tree = this.parseTags(this.text);
			console.timeEnd("parse xml from "+this.url);
		},
		
		debug : function() {
			this.forEach(function(it, object, indent){console.info(indent, it)});
		},
		
		forEach : function(method, object) {
			console.time(this.infoString+".forEach");
			this.forEachChild(this.tree, method, object, "");
			console.timeEnd(this.infoString+".forEach");
			return this;
		},
		
		forEachChild : function(children, method, object, indent) {
			for (var i = 0, len = children.length; i < len; i++) {
				var child = children[i];
				if (method) method(child, object, indent);
				if (child.children) this.forEachChild(child.children, method, object, indent+"\t");
			}
		},
		
		outputAttributes : function(attributes, indent) {
			if (!attributes) return "";
			var output = [];
			for (var key in attributes) {
				var value = this.normalizeValue(key, attributes[key]);
				output.push('"' + key + '" : ' + value);
			}
			return indent + output.join(",\n"+indent)
		},

		_messageParser : /\s*([^\(]+)\((.*)\)/,
		normalizeValue : function(key, value) {
			if (!value) return "undefined";
			if (key.indexOf("on") == 0) {
				// convert to a function
				return "function "+key+"(event,target){if(!event) event = window.event; "+value+"}";
			}
			if (value.indexOf("::") > -1) {
				value = value.split("::");
				var match;
				if (value[0] == "messages") {
					if (match = value[1].match(this._messageParser)) {
						return "messages['"+match[1]+"'].interpolate("+match[2]+")";
					} else {
						return "messages['"+value[1]+"']";
					}
				} else {
					return value[1];
				}
			} else if (value == "true" || value == "false" || value == "null") {
				return value;
			} else if (""+parseFloat(value) == value) {
				return parseFloat(value);
			} else {
				return '"' + value.makeDoubleQuoteSafe() + '"';
			}
		},
		
		
		// Parse some XML, yielding an array:
		//		- for matched tags, an object with:
		//			- .tagName
		//			- .attributes
		//			- .startIndex			start character index in the source string
		//			- .endIndex				end character index in the source string
		//			- .text					inner text of node (if not unary tag)
		//			- .children				array of children from recursive call to Parser.parseTags
		//									NOTE: we do not descend into children if tag name is
		//										in this.opaqueTagMap
		//		- for text between tags, just returns a string
		//
		// This should handle nested tags OK.  Skips whitespace before/after tags.
		//
		// NOTE: does NOT handle comments well -- 
		//			it just treats them as plain text, so nodes that are commented out will be wacky.
		parseTags : function (text) {
			var genericStart = Parser.genericTagStartParser;
			var results = [], lastEnd = 0, match, endMatch, middle;
		
			genericStart.lastIndex = 0;
			while (match = genericStart.exec(text)) {
				if (lastEnd != match.index) {
					var string = text.substring(lastEnd, match.index).trim();
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
					result.attributes = (this.parseAttributes ? attributes.parseAttributes() : attributes);
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
		
					while (endMatch = end.exec(text)) {
						middle = text.substring(endOfNestedStart, endMatch.index);
						// if we can't find another instance of start, stop here
						start.lastIndex = 0;
						if (!start.test(middle)) break;
						// otherwise notice that we're dealing with a nested tag and keep going
						nested = true;
						endOfNestedStart = endMatch.index
					}
					if (!endMatch) return console.error("parseTags(): can't match ",genericStart," in string '",text,"'");
	
					result.text = text.substring(endOfFirstStart, endMatch.index);

					// descend unless the tag is listed as an opaqueTag
					if (!this.opaqueTagMap[result.tagName.toLowerCase()]) {
						result.children = this.parseTags(result.text);
					}
					result.endIndex	= endMatch.index + endMatch[0].length;
					lastEnd = genericStart.lastIndex = end.lastIndex;
				}
				results.push(result);
			}
			if (lastEnd != text.length) results.push(text.substr(lastEnd));
		
			return results;
		}

	}	
});











