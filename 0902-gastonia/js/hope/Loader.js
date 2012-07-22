
// set up the Hope object, passing any defaults already stored in window.hope
function HOPE(defaults){
	if (defaults) for (var key in defaults) this[key] = defaults[key];
}
window.hope = new HOPE(window.hope);
// stub in the hope debug/warn/error flags
hope.info = hope.debug = hope.warn = hope.error = {};



//
//	bootstrap just enough of the ClassFactory to remember things that want to load 
//	before we're done loading the ClassFactory
//
hope.ClassFactory = window.ClassFactory = {
	id 					: "hope::ClassFactory",
	BootstrapCreates	: [],
	BootstrapIncludes	: [],
	LoadedThings 		: {},
	
	// stub out create to remember everything that wants to load before the ClassFactory is loaded
	create : function(params) {
		ClassFactory.BootstrapCreates.push(params);
		return false;
	},
	
	include : function() {
		ClassFactory.BootstrapIncludes.push(arguments);
	}
}
hope.create = ClassFactory.create;
hope.include = hope.when = hope.includeSilently 
	= ClassFactory.includeSilently = ClassFactory.when = ClassFactory.include;


hope.TagToIdMap = {};

window.Loader = {
	id					: "Loader",
	superclass			: "Singleton",
	
	loaderFileName		: "loader.js",
	manifestFileName 	: "manifest.json",
	defaultNamespace	: "hope::",

	Manifests : {},
	IdToUrlMap : {},
	IncludedUrls : {},
	
	//
	//	Namespaces and ids
	//
	
	// register a namespace for loading classes
	registerNamespace : function(namesp, url, thing) {
		Loader.IdToUrlMap[namesp] = url;
		if (thing || !window[namesp]) window[namesp] = thing || {};
	},

	addToNamespace : function(id, thing) {
		var split = this.normalizeId(id).split("::"),
			namesp = split[0], 
			id = split[1],
			parent = window[namesp]
		;
		if (!parent) throw "Loader.addToNamespace("+id+"): namespace "+split[0]+" not found";

		parent[id] = thing || {};
		// if it is in the "hope" namespace, stick it into the window as well		
		if (namesp == "hope") window[id] = parent[id];
	},

	normalizeId : function(id) {
		return (id && id.indexOf("::") == -1 ? this.defaultNamespace + id : id);
	},
	
	normalizeIds : function(ids) {
		if (!ids) return;
		if (typeof ids == "string") ids = ids.split(" ");
		ids = ids.map(function(id) {
			return Loader.normalizeId(id);
		});
		return (ids.length ? ids : null);
	},
	
	idToUrl : function(id) {
		var url = this.IdToUrlMap[id];
		if (url) return url;
		var split = this.normalizeId(id).split("::"), namesp = split.shift();
		var urlPrefix = this.IdToUrlMap[namesp];
		if (!urlPrefix) throw "Loader.idToUrl("+id+"): can't find namespace "+namesp;
		return urlPrefix + split.join("/");
	},
	
	idToGlobalRef : function(id) {
		return this.normalizeId(id).split("::").join(".");
	},
	
	idToNamespace : function(id) {
		id = id.split("::");
		return (id.length == 2 ? id[0] : "hope");
	},
	
	idToName : function(id) {
		id = id.split("::");
		return (id.length == 2 ? id[1] : id[0]);
	},

	//
	//	including script files via inlining a "<script src=''/>" tag
	//

	// stub to include scripts without any error checking
	//	DON'T USE THIS DIRECTLY UNLESS YOU KNOW WHAT YOU ARE DOING 
	//	-- USE Script.include()  in Script.js
	includeScript : function(url, callback, errback, type) {
		// if we've already loaded this one, call the callback and bail
		if (Loader.IncludedUrls[url]) {
			if (callback) callback();
			return;
		}
		// remember the URL for later
		Loader.IncludedUrls[url] = true;
console.warn(url);
		if (!type) type = "text/javascript";
		try {
			var script = document.createElement("script");
			if (callback || errback) {
				if (Loader.isIE) {
					script.onreadystatechange = function() {
						if (script.readyState == "loaded" || script.readyState == "complete") {
							callback();
							// TODO: not sure how to do the errback here
						}
					}
				} else {
					script.onload = callback;
					script.onerror = errback;
				}
			}
			script.setAttribute("src", url);
			script.setAttribute("type", type);
			(document.getElementsByTagName("HEAD") || document.getElementsByTagName("HEAD"))[0]
				.appendChild(script);
		} catch (e) {
			console.error("Loader.includeScript() error: "+e.message);
			if (errback) errback(null, e);
		}		
	},

	// YUCK -- Need to know if we're dealing with IE to know how to handle script responses.
	//		   The below is lifted from prototype.js.
	isIE : !!(window.attachEvent && navigator.userAgent.indexOf('Opera') == -1),
	
	
	// include a set of urls one after the other, calling finishCallback when all are done
	includeList : function(urls, finishCallback) {
		var next = 0;
		function loadNext() {
			var url = urls[next++];
			if (url) Loader.includeScript(url, loadNext);
			else if (finishCallback) finishCallback();
		}
		loadNext();
	},

	//
	// Dealing with manifest files (in the same format as Google's ManagedResourceStore
	//
	
	loadManifest : function(urlPrefix, callback) {
		var manifest = this.loadJSON(urlPrefix + this.manifestFileName);		
		var namesp = manifest["namespace"]; 
		if (!namesp) throw "Manifest "+path+" does not specify a namespace";

		this.Manifests[namesp] = manifest;
		this.IdToUrlMap[namesp] = urlPrefix;

		var preloads = [];
		manifest.entries.map(function(entry) {
			// make sure urls are qualified relative to the path
			if (entry.url && entry.url.charAt(0) != "/") entry.url = urlPrefix + entry.url;

			if (entry.preload != null) preloads[entry.preload] = entry.url;

			if (!entry.id) return;
			this.normalizeIds(entry.id).map(function(id) {
				if (entry.url) this.IdToUrlMap[id] = entry.url;
					
				if (entry.tagName) {
					var tagName = entry.tagName.toLowerCase(),
						globalRef = this.idToGlobalRef(id)
					;
					
					hope.TagToIdMap[tagName] = globalRef;
					hope.TagToIdMap[namesp.toLowerCase() + "::" + tagName] = globalRef;
				}
			}, this);
		}, this);

		if (preloads.length) {
			manifest.preloads = preloads;
			this.includeList(preloads, function(){ 
				if (callback) callback();
				hope.loadedManifest(manifest);
			});
		}
	},

	// load a url synchronously and return the responseText
	loadText : function(url) {
		var request = new XMLHttpRequest();
		request.open("GET", url, false);
		request.send(null);
		if (request.status != 200) throw "Could not load file " + url;
		return request.responseText;
	},
	
	// load a url synchronously and return the responseText as eval'd JSON
	loadJSON : function(url) {
		var json = this.loadText(url);
		return (window.JSON && JSON.parse ? JSON.parse(json) : eval("("+json+")"));		
	},
	
	_getLoaderPath : function() {
		// figure out the path to the hope object
		if (!this.loaderPath) {
			// get the pointer to this script, which should be called "loader.js"
			var scripts = document.getElementsByTagName("script"),
				loaderFileName = this.loaderFileName,
				script, i = 0
			;
			
			// find the path to the hope directory
			// by find the loader file in the script tags on the page
			while (script = scripts[i++]) {
				var src = script.getAttribute("src") || "",
					index = src.indexOf(loaderFileName)
				;
				if (index > -1) {
					return (this.loaderPath = src.substr(0, index));
				}
			};
		}
		if (!this.loaderPath) throw "Error initializing loader: loader file must be named '"
	}
};


// Make sure the XMLHttpRequest object is defined in IE by assigning one if necessary.
if (!window.XMLHttpRequest) {
	(function(){	// hide from global scope
		var methods = [
			  function() {return new ActiveXObject('Msxml2.XMLHTTP')},
			  function() {return new ActiveXObject('Microsoft.XMLHTTP')}
		],method;
		while (method = methods.shift()) {		
			try {
				var request = method();
				// if we get here, the method is valid (and we're in IE)
				Loader.isIE = true;
				window.XMLHttpRequest = method;
				break;
			} catch (e) {}
		};
	})();
}

// HACK:  Prototype's installs its own versions of "every", "filter", "map" and "some"
//			over top of the native Array.prototype functions defined in FF, Webkit, IE8
//  	  If they exist now, squirrel them away so we can re-establish them in prototype.extensions.js
if (Array.prototype.map) {
	Loader.arrayExtensions = {
		map : Array.prototype.map,
		each : Array.prototype.forEach,
		filter : Array.prototype.filter, 
		some : Array.prototype.some,
		every : Array.prototype.every
	}
} else {
	// make sure at least Array.prototype.map is defined since we'll use it above
	Array.prototype.map=function(f,it){
		for(var i=0,l=this.length,out=[];i<l;i++)
			if(i in this)out[i]=f.call(it,this[i],i,this);
		return out;
	}
}

// Load the manifest in the same folder as the loader itself.
//	This will be the {hope} manifest.
Loader.loadManifest(Loader._getLoaderPath());

