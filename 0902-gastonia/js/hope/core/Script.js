//
//	Object for loading and managing scripts
//
//	This will be initialized as a Singleton later
//
ClassFactory.create({
	id 				: "Script",
	superclass 		: "Singleton",
	mixins			: "FileIncluder",
	
	defaultType		: "text/javascript",
	
	fileExtension 	: ".js",	// defaut file extension for script files

	includeOne : function(url) {
		// note: have to create functions to bind <url> parameter
		var callback = function() { Script.included(url)	},
			errback  = function() { Script.includeFailed(url) 		}
		;
		// use the Loader.includeScript
		Loader.includeScript(url, callback, errback);
		
		return url;	// return the url because we're loading it
	},
	
	insert : function(scriptText, attributes, infoString) {
//console.warn("script.insert():\n",scriptText);
		attributes = attributes || {};
		if (infoString) {
			attributes.info = infoString;
			scriptText = "/* "+infoString+ "*/\n\n"+scriptText;
		}
		if (!attributes.type) attributes.type = this.defaultType;

		var script = new Element("script", attributes);

		// in WebKit, you must set innerText, in Gecko, innerHTML...  sigh :-(
		if (Prototype.Browser.WebKit) {
			script.innerText = scriptText;
		} else {
			script.innerHTML = scriptText;
		}
		document.appendToHead(script);		
	}
	
})	// hope.create(Script)
