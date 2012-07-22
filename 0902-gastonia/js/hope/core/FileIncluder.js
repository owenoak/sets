//
//	FileIncluder -- abstract class to load files exactly once.
//
//	Subclasses must implement  includeOne(url)
//		to load (and optionally process) a single url.
//		See Script.js and Expander.js
//
//
//	TODO: 	- minimize the API on the mixin by rooting many of these things on FileIncluder?
//
ClassFactory.create({
	id 				: "FileIncluder",
	superclass 		: "Mixin",

	IncludeCallbacks: {},		// callbacks that are waiting on a file to finish loading
	IncludeErrbacks : {},		// errorbacks, called when a file fails to load

	LOAD_ERROR		: null,		// flag that there was a load error when loading a file

	applyTo : function(it) {
		Mixin.applyTo.call(this, it);

		it.IncludeStates 	= {};	// urls or ids that we have tried to include once already
									// value for each id will be "loading" or "loaded" or "failed"
		it.IdToUrlMap 		= {};	// map of id => url for things we've loaded
		it.UrlToIdMap 		= {};	// map of url => id for thing we've loaded
	},

	defaults : {
		//fileExtension 	: "",		// default to no file extension
		LOAD_ERROR		: null
	},

	methods : {
	
		// Include a file in the page
		//	Pass a url or a normalized id (e.g. "hope::Foo").
		//
		// TODO: check on timer to see if script returned a 404?
		include : function(url, callback, errback) {
			if (!url || url.length == 0) throw(this.id+".include("+url+"): invalid url passed");

			// if passed an array, use includeList() instead
			//	which will munge the callbacks so they are only called once for all files
			//	and recursively call us
			if (Object.isArray(url)) {
				if (url.length > 1) 	return this.includeList(url, callback, errback);
				else					url = url[0];		// short-circuit for singleton arrays
			}
			
			var id;
			if (url.indexOf("::") > -1) {		// they specified an id, not a url
				id = url;
				url = this.idToUrl(id);
			}

			// we always add the callbacks/errbacks to the FileIncluder listmaps
			//	so we don't create them unnecessarily for objects that don't need them
			if (callback) hope.addToListMap(FileIncluder.IncludeCallbacks, url, callback);
			if (errback) hope.addToListMap(FileIncluder.IncludeErrbacks, url, errback);
			
			// check the current includeState of the url
			var state = this.IncludeStates[url];
			switch (state) {
				case "loaded":
					(hope.debug.include) && console.info("---- "+url, " has already finished loading ----");
					if (callback) calback();
					return false;		// indicates that nothing is left to load
	
				case "failed":
					(hope.debug.include) && console.info("---- "+url, " has already FAILED ----");
					if (errback) errback();
					return this.LOAD_ERROR;
	
				case "loading":
					(hope.debug.include) && console.info("---- "+url, " is already loading ----");
					return (id ? id : url);
			}

			(hope.debug.include && console.info(">>>> loading url ",url, " >>>>"));
			this.setIncludeState(url, "loading");
			var returned = this.includeOne(url, callback, errback);
			if (typeof returned == "string") return (id || url);
			return returned;
		},
		
		// include a list of urls, calling callback ONCE when ALL have loaded
		includeList : function(urls, callback, errback) {
			if (!urls || !Object.isArray(urls)) return true;
			
			// if they specified a callback, make sure we only execute it once 
			//	when everything is done loading
			if (callback) {
				var originalCallback = callback;
				callback = function(url, payload) {
					if (this.includeState(urls) == "loaded") originalCallback(url, payload);
				}.bind(this);
			}
			// if they specified an errback, make sure it is only called once
			//	no matter how many files fail
			if (errback) {
				var originalErrback = errback;
				errback = function(url) {
					if (originalErrback) originalErrback(url);
					// clear out the original errback so we only call this once
					originalErrback = null;
				}
			}
			
			// figure out what to return:
			//	if any failed, return false
			//	if any urls were returned, those are still loading -- return the urls
			//	else return true 'cause all were loaded
			var returned = urls.map(function(url) { this.include(url, callback, errback) }, this);
			var failed = false, urls = [];
			returned.forEach(function(value) {
				if (value == false) failed = true;
				else if (typeof value == "string") urls.push(value);
			});
			if (failed) return false;
			if (urls.length) return urls;
			return true;
		},
		
		// call this back when load succeeds (after doing whatever you want with the payload)
		//	this cleans up and calls any necessary callbacks
		included : function(url, payload) {
			if (hope.debug.include) console.info("<<<< finished loading "+url,"<<<<");
			if (hope.info.include) console.info("loaded file ",url);
			
			this.setIncludeState(url, "loaded");

			var callbacks = FileIncluder.IncludeCallbacks[url];
			if (callbacks) callbacks.tryExecuting("error executing callback to load of "+url, url, payload);
			delete FileIncluder.IncludeCallbacks[url];
		},
		
		includeFailed : function(url, e) {
			(hope.debug.include && console.error("**** Error loading '"+url+"': ", e));
			this.setIncludeState(url, "failed");

			var errbacks = FileIncluder.IncludeErrbacks[url];
			if (errbacks) callbacks.tryExecuting("error executing errback to load of "+url, url);
			delete FileIncluder.IncludeCallbacks[url];
		},
	
		idToUrl : function(id) {
			if (!id) return;
			if (Object.isArray(id)) return id.map(function(id){return this.idToUrl(id)},this);
			
			id = Loader.normalizeId(id);
			if (this.IdToUrlMap[id]) return this.IdToUrlMap[id];
	
			var url = Loader.idToUrl(id);
			if (this.fileExtension && url.indexOf(this.fileExtension) == -1) url += this.fileExtension;
			// add timestamp if hope.debug.cache is true
			if (hope.debug.cache) url += "?ts="+(new Date()).getTime();

			// set up the url to id maps
			this.IdToUrlMap[id] = url;
			this.UrlToIdMap[url] = id;
			
			return url;
		},
		
		// NOTE: only works for urls we have seen before
		urlToId : function(url) {
			if (Object.isArray(url)) return url.map(function(url){return this.urlToId(url)},this);
			return this.UrlToIdMap[url];
		},
		
		includeState : function(urls) {
			if (typeof urls == "string") return this.IncludeStates[urls];
			for (var i = 0, state; state = this.IncludeStates[urls[i]]; i++) {
				// if any are "loading" or "failed", that is the composite state
				if (state == "loading" || state == "failed") return state;
				// if there is no state, return "unknown"  (???)
				if (state == null) return "unkown";
			}
			// if we get here, all must be loaded!
			return "loaded";
		},
	
		setIncludeState : function(url, state) {
			this.IncludeStates[url] = state;
			var id  = this.UrlToIdMap[url];
			if (id)  this.IncludeStates[id] = state;
		}
	}
})	// hope.create(FileIncluder)

