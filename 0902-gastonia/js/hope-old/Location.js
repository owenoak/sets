
	
	//
	//	Location class -- used to parse URLs
	//
	//	To create a location:
	//		var loc = hope.Location.create(url || tag)
	//
	//	To access the different parts of the location, do:
	//		loc("filename")
	//	
	//	For example:
	//	
	//		var loc = hope.Location.create(  "http://server.port/path/to/file.foo?p1=v1&p2=v2#hash" );
	//
	//		loc.url()					==>  "http://server.port/path/to/file.foo?p1=v1&p2=v2#hash"
	//		loc.href()					==>  "http://server.port/path/to/file.foo?p1=v1&p2=v2#hash"
	//		loc.fullpath()				==>  "http://server.port/path/to/"
	//		loc.prefix()				==>  "http://server:port"
	//		loc.protocol()				==>  "http:"
	//		loc.host()					==>  "server:port"
	//		loc.hostname()				==>  "server"
	//		loc.port()					==>  "port"
	//		loc.pathname()				==>  "/path/to/file.foo"
	//		loc.path()					==>  "/path/to/"
	//		loc.file()					==>  "file.foo"
	//		loc.filename()				==>  "file"
	//		loc.extension()				==>  ".foo"
	//		loc.search()				==>  "?p1=v1&p2=v2"
	//		loc.protocolAndServer()		==>  "#hash"
	//
	//		loc.isRelative				==>  false
	//
	//
	//	Note that 	loc.url() 		will ALWAYS return a full URL (relative to the page's document URL)
	//		 and 	loc.href()		will be a relative URL if the original url was relative.
	//
	ClassFactory.create({	
		id : "Location", 
		superclass:"BaseClass",
		// instance properties and methods
		defaults : {},
		methods : {
		
			initialize : function (url) {
				this.originalUrl = url;
				this.match = [];
				
				var match, 
					positions = hope.Location.positions
				;
			
			
				// if they passed a tag, try to find it's src or href attribute
				if (url && typeof url != "string" && url.getAttribute) {
					this.originalUrl = url = url.getAttribute("src") || url.getAttribute("href");
				} else {
					url = "" + url;		// in case they passed a window.location object
				}
				if (!url) return (hope.warn.location && console.warn("hope.Location.create(",this.originalUrl,"):  url not understood"));
			
				// interpolate in case they have any #{references} in the url
				url = url.interpolate(hope.Locations);
				
				// now try to match the url with our honkin' regular expression below
				var match = hope.Location.urlParser.exec(url);
				if (!match) {
					this.match = [];
					return (hope.warn.location && console.warn("Location constructor: could not match url ",url," (originally: ",this.originalUrl,")"));
				}
			
				// the function that encapsulates the location
				this.match = match;
				
				// normalize the path
				var positions = hope.Location.positions;
				this.match[positions.path] = hope.Location.normalizePath(this.match[positions.path] || "");
				this.isRelative = this.match[positions.path].charAt(0) != "/";
				// error in regex -- if file name but no extension, filename doesn't get filled in
				match[positions.filename] = match[positions.filename] || match[positions.file];
				
				// remember for later as the url passed in, as well as the full url
				hope.Locations[this.originalUrl] = this;
				hope.Locations[url] = this;
			},

			
			get : function (part, key) {
				switch (part) {
					case "params":		return this.params(key);
					case "url":			return this.url();
					case "urlpath":		return this.urlpath();
				}
		
				var positions = hope.Location.positions,
					position = positions[part]
				;
				if (position == null) return (hope.warn.location && console.warn("location(",part,",",key,") could not understand part '",part,"' (for location "+location,")"));
				if (typeof position == "number") return this.match[position];
				var loc = this;
				return position.collect(function(part){return loc.match[positions[part]] || ""}).join("");
			},
		
			params : function(key) {
				if (!this._params) this._params = (this.match[positions.search] || "").toQueryParams();
				return (key ? this._params[key] : this._params);
			},
		
			// same as fullpath, but it is a fully qualified path relative to context location
			//		eg:  for  	 /foo/bar
			//			yeilds	http://context.server/foo/bar
			urlpath : function(context) {
				// shorten down to the match for the below for clarity
				var positions = hope.Location.positions,
					location = this.match;
				;
				if (location == null) return "Unknown URL";
				context = (context || hope.Locations.page).match;
				if (this.isRelative) {
					return context[positions.prefix] + context[positions.path] + location[positions.path];
				} else {
					return (location[positions.prefix] || context[positions.prefix]) + location[positions.path];
				}
			},
		
			// same as href, but it is a fully qualified URL relative to context location
			url : function(context) {
				var url = this.urlpath(context),
					positions = hope.Location.positions
				;
				url += (this.match[positions.file] || "");
				url += (this.match[positions.search] || "");
				url += (this.match[positions.hash] || "");
				return url;
			},
			toString : function(){return this.url()}
		},
		
		// class properties and methods
		classDefaults : {
			urlParser : /(((?:(\w*:)\/\/)(([^\/:]*):?([^\/]*))?)?([^?]*\/)?)(([^?#]*)(\.[^?#]*)|[^?#]*)(\?[^#]*)?(#.*)?/,
		
			positions : {
			// e.g. for: 
				href				: $w("prefix path file search hash"),	// 	http://server.port/path/to/file.foo?p1=v1&p2=v2#hash
				fullpath			: $w("prefix path"),					// 	http://server.port/path/to/
				prefix				: 2,									// 	http://server:port
				protocol			: 3,									// 	http:
				host				: 4,									// 	server:port
				hostname			: 5,									// 	server
				port				: 6,									// 	port
				pathname			: $w("path file"),						// 	/path/to/file.foo
				path				: 7,									// 	/path/to/
				file				: 8,									// 	file.foo
				filename			: 9,									// 	file
				extension			: 10,									// 	.foo
				search				: 11,									// 	?p1=v1&p2=v2
				hash				: 12,									// 	#hash
			}
		},
		
		classMethods : {
			// try to find path in our list of locations
			//	if not possible, create it and return it
			get : function(path, part) {
				if (hope.Locations[path]) return hope.Locations[path];
				var interpolated = path.interpolate(hope.Locations);
				if (hope.Locations[interpolated]) return hope.Locations[interpolated];
				return new hope.Location(path);
			},

			// remember a path under a specified id
			//	if you pass a string path, will create a location
			remember : function(id, path) {
				if (!path) throw "Must pass a path";
				if (!path.isALocation) path = new Location(path);
				hope.Locations[id] = path;
				return path;
			},

			
			// remove any "." and ".." entries in the path
			normalizePath : function(path) {
				if (path.indexOf(".") != -1 && path.indexOf("//") != -1) return path;
				path = path.split("/./").join("/").split(/\/\/+/).join("/");
				path = path.split("/");
				for (var i = 0; i < path.length; ) {
					var segment = path[i];
					if      (segment == ".") 	path.splice(i, 1);
					else if (segment == "..") 	path.splice(--i, 2);
					else						i++;
				}
				return path.join("/");
			},
			
			toString : function(){return "(hope.Location)"}
		},
	
		// initialize the class
		initialize : function() {
			// set up the Locations registry
			hope.Locations = {};
			
			// and put the base path of this page in the file
			var pageUrl = hope.Location.remember("pageUrl", window.location);
			hope.Location.remember("page", pageUrl.urlpath(pageUrl));
			hope.Location.remember("basePath", hope.Locations.page);

			// add getter convenience methods
			Object.keys(this.positions).each(
				function(key) {
					this.prototype[key] = function(){	return this.get(key)	}
				}.bind(this)
			);
		}
	});
	