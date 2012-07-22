
//
//	Expanders:  transform strings into HTML
//
hope.create({
	id 			: "Expander",
	superclass	: "BaseClass",
	classMixins	: "FileIncluder",
	requires	: "Stylesheet",
	
	defaults : {},
	methods : {
		initialize : function(attributes, expanderMethod) {
			this.extend(attributes);
			this.expand = expanderMethod;
		},

		// evaluate a template and return all element children that it expanded
		// NOTE: this ignores text nodes OUTSIDE the outer children
		toElements : function(object) {
			var div = new Element("div");
			div.innerHTML = this.expand(object);
			return div.childElements();
		},
		
		// return the first element that is a child of the expanded HTML
		toElement : function(object) {
			return (this.toElements(object) || [])[0];
		}
	},
	
	
	classDefaults : {
		fileExtension 	: ".expanders"
	},
	

	classMethods : {

		// load a template file under a particular URL
		// NOTE: loads asynchronously
		includeOne : function(url, immediate) {
			var idPlusExtension = this.urlToId(url) + this.fileExtension;
			var request = new Ajax.Request(url, {
				method 			: "GET",
				asynchronous	: (immediate ? false : true),
				onSuccess 		: function(transport) {
					var payload = transport.responseText;
try {
					var expanders = Expander.parseFile(payload, "Loaded from "+url);
} catch (e) {"error loading expanders:"+console.error(e.message, e);throw(e)};
					ClassFactory.included(idPlusExtension, expanders);
					Expander.included(url, payload);
				},
				onFailure 		: function(response) {
					Expander.includeFailed(url, response.responseText);
					ClassFactory.includeFailed(idPlusExtension);
				}
			});
			return url;
		},

		// expand a named template
		expand : function(id, context) {
			var expander = this.byId(id);
			if (expander) return expander.expand(context);
		},
			
		// parse expanders out of a string (e.g. returned from loadTemplateFile)
		//	as  <expander id='...'>...</expander>
		parseFile : function(string, infoString) {
			// pull out any stylesheets and install them
			hope.Stylesheet.parse(string, infoString);
try{
			// instantiate any expanders in the file and return them
			Expander.parseExpanderTags(string, infoString);
} catch (e) {"error in parseExpanderTags"+console.error(e.message, e);throw(e)};
		},
		
		// parse a single chopped expander tag
		_parseExpanderTagChop : function(next, infoString) {
			var startLine = next.source.substring(0, next.startIndex).split("\n").length,
				attributes = next.start[1].parseAttributes(),
				methodText = Expander.parseSingleExpanderHTML(attributes.id, next.middle,"\t\t")
			;
			return [
				"/* " + (infoString || "") + " line " + startLine + " */",
				"new Expander(",
				"\t\t"+Object.toJSON(attributes)+",",
				"\t\t"+methodText,
				");"
			].join("\n") + "\n";	// add line break at end
		},

		parseExpanderTags : function(string, infoString) {
			var scriptBlocks = string.forEachTag("expander", Expander._parseExpanderTagChop, infoString);
			var script = scriptBlocks.join("\n\n");
//console.warn(script);
			Script.insert(script, null, infoString)
		},
		
		
		// NOTE: at this time this does NOT handle 
		//			- <#>{}</#>
		//			-  #{ {} }
		_expanderStartTag : /([#@]\{|<#>)/g,
		_expanderEndTag : /(<\/#>|\})/g,

		parseSingleExpanderHTML : function(id, string, indent) {
			indent = (indent || "");
			
			// first find and replace all #{...} 
			// NOTE: does not handle nested {} at this time
			
			var chopped = string.chop(this._expanderStartTag, this._expanderEndTag),
				script = [];
			;
			
			// TODO: move this into non-inlined function for speed?
			chopped.forEach(function(next) {
				if (typeof next == "string") {
					script.push("output += " + next.toJSON() + ";");
					return;
				}
					
				// handle  <#>...</#>
				if (next.start[0] == "<#>") {
					script.push(next.middle);
				}
				// handle  #{...}
				// doing a try/catch for now, may want to reconsider for speed
				//
				// TODO: we can avoid try..catch if there's no dots in the middle
				//			or not a function
				else {
					if (next.start[0] == "@{") {
						if (next.middle == "events") {
							script.push("if (context.outputEventHandlers) output += context.outputEventHandlers();");
						} else {
							script.push(
								"if ((it = context."+next.middle+") != null && it != '')"
									+" output += '"
											+ (next.middle.toLowerCase() == "classname" ? "class" : next.middle)
										+"=\"' + it + '\"';"
							);
						}
					} else {
						// only output try...catch if it's a complex expression
						var complex = (next.middle.indexOf(".") > -1 || next.middle.indexOf("(") > -1); 
						script.push(
							(complex ? "try {" : "")
								+ "if ((it = context."+next.middle+") != null) output += it;"
							+ (complex ? "} catch(e){}" : "")
						);
					}
				}
			});
			
			return [
				"function Expand_"+hope.legalizeId(id)+"(context) {",
				"	context = context || {};",
				"	var it;",
//				"	with (Expander) {",
				"	try {",
				"		var output = '';",
				"		"+script.join("\n		"+indent),
//				"	console.warn(output);",
				"		return output;",
				"	} catch (e) {",
				"		console.error('error expanding \""+id+"\":' + e.message);",
				"		return '';",
				"	}",
//				"	}",
				"}"
			].join("\n"+(indent||""));
		}
	}
});
	
