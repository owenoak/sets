
//
//	Encapsulate stylesheets so we can load them, etc
//		-- todo: stylesheet vars?
//	
hope.create({
	id 						: "Stylesheet",
	superclass 				: "Singleton",
	mixins					: "FileIncluder",
	
	fileExtension			: ".css",
	variableFileExtension	: ".cssv",		// items with 'cssv' will automatically be parsed
											// via our parseStylesheet method

	intialize : function($super) {
		$super();
		console.warn("done with stylesheet");
	},

	includeOne : function(url) {
		if (url.indexOf(this.variableFileExtension) > -1) {
			var request = new Ajax.Request(url, {
				method : "GET",
				asynchronous : true,
				onSuccess : function(transport) {
					Stylesheet.insert(transport.responseText, null, "Loaded from '"+url+"'");
				},
				onFailure : function(response) {
					console.warn("Could not load stylesheet '",url,"'");
				},
				onException : function(response, exception) {
					console.error("Error loading stylesheet '",url,"':\n",exception.message);
				}
			});
		} else {
			var stylesheet = new Element("link", {rel:"stylesheet", href:url, type:"text/css"});
			document.appendToHead(stylesheet);
			Stylesheet.included(url);
			// note that we've loaded
			Stylesheet.setIncludeState(url, null, "loaded");
		}

		return false;	// return false to indicate that load can complete without waiting
	},
	
	// parse any stylesheets from a string and insert them into the document
	parse : function(string, infoString) {
		string.forEachTag("style", hope.Stylesheet.insert, null, infoString);
	},
	
	// Insert a stylesheet as text into the document.
	// Note: this will use Stylesheet.parseVariables() to parse any variable definitions in the file.
	insert : function(cssText, attributes, infoString) {
		// parse any variables in the file
		cssText = Stylesheet.parseVariables(cssText);

		// create the stylesheet element
		attributes = attributes || {type:"text/css"};		
		// if info string was passed in, include it as a comment at the top of the file
		if (infoString) {
			cssText = "/"+"* "+infoString + "*"+"/\n\n" + cssText;
			attributes.info = infoString;
		}

		if (false) {//Prototype.Browser.IE) {
			var stylesheet = new Element("style", attributes);
			stylesheet.innerHTML = cssText;
			
		} else {
			// for WebKit, we can't amend the innerHTML of a stylesheet
			//	but we can make a bogus element, add a stylesheet HTML to it
			//	then grab the STYLE element out of it.
			var el = new Element("div"),
				attributes = Object.toArray(attributes, "=", true).join(" ")
			;
			el.innerHTML = "<style "+attributes+">"+cssText+"</style>";
			var stylesheet = el.select("STYLE")[0];
		}

		document.appendToHead(stylesheet);
	},

	// CSS variable replacement
	//	See:  http://disruptive-innovations.com/zoo/cssvariables/
	//
	//	TODO: does not handle stylesheet rules or defs in nested comments well!
	//
	//	- Variables are defined in rules like so: 
	//		@variables {
	//			<varname> : <value>;	/* careful of comments */
	//		}
	//
	//	- Variables referenced in CSS as:
	//		.normal > rule {
	//			background: var(<varname>);
	//		}
	//	
	//	NOTE:
	//		- keeps a global object of variables, so same vars should apply to all stylesheets
	//			(as per spec)
	//		- currently the variables are mutable by later definitions
	//			(unclear if spec allows this or not)
	//		- does NOT change live stylesheets through reassignment of variables
	//			(contrary to spec)
	//		- does NOT handle media queries
	//			(contrary to spec)
	//
	Variables : {},
	debugVariables : true,
	parseVariables : function(cssText) {
		// first parse out the variable declaration
		cssText = cssText.gsub( Stylesheet._variableDeclarationParser, 
							    Stylesheet._parseVariableDeclarations
							  );
		cssText = cssText.gsub( Stylesheet._variableReferenceParser, 
							    Stylesheet._parseVariableReference
							  );
		return cssText;
	},
	// variable declaration:  @variables {<name>:<value>;}
	_variableDeclarationParser : /@variables\s*\{\s*([^}]*?)\s*\}/i,
	_variableDeclarationItemParser : /([^:\s]*)\s*:\s*(.*?)\s*$/m,
	_parseVariableDeclarations : function(match) {
		match[1].gsub(	Stylesheet._variableDeclarationItemParser, 
						Stylesheet._parseVariableDeclaration
					);
		return (Stylesheet.debugVariables ? "/* " + match[0] + " */" : "");
	},
	_parseVariableDeclaration : function(match) {
		Stylesheet.Variables[match[1]] = match[2];
	},
	
	// variable references:  var(<varname>)
	_variableReferenceParser : /var\s*\(\s*([^\)]*?)\s*\)/i,
	_parseVariableReference : function(match) {
		return (Stylesheet.Variables[match[1]] || "undefined")
			 + (Stylesheet.debugVariables ? " /*"+match[0]+"*/" : "");
	}
});
