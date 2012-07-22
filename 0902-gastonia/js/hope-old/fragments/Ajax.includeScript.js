/*
	INVESTIGATE
		* FF
			- scriptElement.baseURI -- seems to be full path thing was loaded from
			- 




*/



Object.extend(Ajax, 
{
	// Include a script file and perform callback when it is complete
	//
	// TODO: allow them to pass a callback
	// TODO: allow multiple paths (and perform callback once when all are loaded)
	// TODO: how to know if we got a 404?
	//			wait a bit and check the script.innerHTML for string "404"  ???
	includeScript : function(path, callback) {
		var callback;
		
		// NOTE: this is not safe!
		//	the script may be present but not completed yet...
		if (Ajax.pathAlreadyLoaded("script", path)) {
			(hope.info("include") && console.info("<<<< includeScript:  ",path," is already loaded <<<<"));
			return true;
		}
	
		if (hope.info("include")) {
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
			index = file.lastIndexOf(".")
		;
		if (index == -1) return file;
		return file.substr(0, index);
	}
}
);


