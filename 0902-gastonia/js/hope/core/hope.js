
// hide the execution of the below so we don't have to worry about polluting the global scope
// 'hope' is defined in the below so you don't have to say   hope.foo() -- you can just say  foo()
(function (){
with (hope) {
try {

	// add the name of the browser to the HTML as a class so we can do custom css per browser
	// HTML tag will have one of the following classes:   "IE", "Gecko", "Webkit", "MobileSafari", "Opera"
	var HTML = $$('HTML')[0];
	for (var browserName in Prototype.Browser) {
		if (Prototype.Browser[browserName]) {
			HTML.className += " " + browserName;
		}
	}

	Object.extend(hope, {
		noop : function noop(){},
		
		// Similar to prototype's <Object.extend> but it will takes
		// an arbitrary number of extension properties objects.
		//	Also deals gracefully with null props objects (although throws if <it> is not defined).
		extend : function extend(it, props, props2, etc) {
			if (arguments.length > 2) return extendList(it, arguments, 1);
			if (!props) return it;
			for (var key in props) { it[key] = props[key] }
			return it;
		},

		// Similar to prototype's <Object.extend> but it will take:
		//		- a single Array of properties objects (and optional startIndex)
		//	Also deals gracefully with null props objects (although throws if it is not defined).
		//
		extendList : function extendList(it, list, startAt) {
			if (!list) return it;
			for (var i = startAt || 0, len = list.length ; i < len; i++) {
				if (! (props = list[i]) ) continue;
				for (var key in props) { it[key] = props[key] }
			}
			return it;
		},

		// Similar to <hope.extend> but will not override any properties already set in <it>.
		extendUnique : function extendUnique(it, props, props2, etc) {
			for (var i = 1, len = arguments.length ; i < len; i++) {
				if (! (props = arguments[i]) ) continue;
				for (var key in props) { 
					if (it[key] === undefined) it[key] = props[key];
				}
			}
			return it;
		},
		
		// extend a particular properies specified by name in names
		extendNamed : function extendNamed(it, names, props) {
			names.each(function(name) {
				if (props[name] != null) it[name] = props[name]; 
			});
			return it;		
		},
		
		maskProtoProperties : function(it, props) {
			for (var key in props) {
				if (it[key] != null && !it.hasOwnProperty(key)) it[key] = null;
			}
		},
		
		// set one object up to delegate methods to a sub-object
		delegate : function(delegator, delegatee, methods) {
			if (typeof methods == "string") methods = $w(methods);
			var method;
			
			if (Object.isArray(methods)) {
				for (var i = 0; i < methods.length; i++) {
					var key = methods[i];
					if (typeof delegatee == "string") {
						method = new Function(
								"return "+delegatee+"."+key+".apply"
									+"("+delegatee+",arguments)");
					} else {
						method = delegatee[key];
					}
					delegator[key] = method;
				}
			} else {
				for (var key in methods) {
					if (typeof delegatee == "string") {
						method = new Function(
							"return "+delegatee+"."+key+".apply"+"("+delegatee+",arguments)");
					} else {
						method = delegatee[key];
					}
					delegator[key] = method;
				}
			}
		}
		
	});
	
	// Set up hope default properties.
	//
	//	If you want to change any of these presets, in a script that loads BEFORE hope.js
	//		create a hope object and set it's properties to your defaults.
	hope.extendUnique(hope, {
		id 						: "hope",
		type 					: "Hope",			// TODO: I thnk we can get rid of this
		globalRef				: "hope",
		hopeFileName			: "hope.js"				// name of this file (so we can find it's script tag later)
	});
	
	hope.toString = function(){
		if (this.constructor && this == this.constructor.prototype) {
			return "["+this.constructor.globalRef + ".prototype]";
		} else {
			return "["+(this.id||this.globalRef||"unnamed "+this.constructor.id+" instance")+"]";
		}
	};
	
	////////
	//
	// 	loading animation
	//
	// 		TODO: we will probably remove this, but for now it shows that we're loading
	//
	////////
	function fade(el, start, end, delta, time, callback) {
		var interval = setInterval(function() {
			el.setOpacity(start+=delta);
			if (   delta > 0 && start >= end
				|| delta < 0 && start <= end) {
				clearInterval(interval);
				if (callback) callback();
			}
		}, time);			
	}
	hope.extendUnique(hope, {
		loadingMsgHTML : "<div style='position:fixed;bottom:10px;right:10px;"
							+"z-index:1000000001;display:inline-block;"
							+"font-size:2em;background-color:tan;"
							+"color:#777;border:3px solid #72624d;"
							+"padding:2px 8px 6px 8px;"
							+"font-family:Trebuchet MS, Arial, Helvetica, sans serif;"
							+"font-weight:bold;-moz-border-radius:.5em;"
							+"-webkit-border-radius:.5em;'>"
								+"{"
									+"<span style='color:black;font:inherit;padding:0px 2px;'>"
										+"hope"
									+"</span>"
								+"}"
							+"</div>",
							
		showLoadingMessage : function() {
			if (!document.body) return setTimeout(hope.showLoadingMessage, 0);
			var msg = $("LoadingMessage");
			if (!$("LoadingMessage")) {
				msg = new Element("div", {id:'LoadingMessage'});
				msg.innerHTML = hope.loadingMsgHTML;
				msg.setOpacity(0);
				document.body.appendChild(msg);
			}
			fade(msg, 0, 1, .1, 20);
		},
		
		hideLoadingMessage : function () {
			var msg = $("LoadingMessage");
			if (msg) setTimeout(function(){fade(msg, 1, 0, -.1, 30, function(){msg.remove()})},600);
		}
	});
	hope.showLoadingMessage();
	
	
	hope.extend(hope, {	
		// Given an object, return a new object whose prototype is the old object.
		// If you pass in null on a non-object, returns {}.
		//
		// If (skipConstructorAssign != true), sets newObject.constructor to 
		//		the constructor of the original object.
		//		NOTE: This makes reflection work properly, but it makes "constructor" 
		//				a property returned by  for..in on newObject.
		//			
		protoClone : function(it, props) {
			if (!it || typeof it != "object") return {};
			function parent(){};
			parent.prototype = it;
			var it = new parent();
			it.constructor = it.constructor;
			if (props) {
				for (var key in props) {
					it[key] = props[key];
				}
			}
			return it;
		},

		// Split a string on spaces.
		// If you pass in an array, simply returns the array.
		// If you pass in anything else, simply returns it.
		//
		// Similar to Prototype's $w() but handles array case.
		_$splitParser : /\s+/,
		$split : function(it) {
			if (typeof it == "string") {
				if (it.indexOf(" ") == -1) return [it];
				it = it.strip();
				return (it ? it.split(hope._$splitParser) : null);
			}
			if (Object.isArray(it) && it.length == 0) return null;
			return it;
		},


		// walk the properties of the context according to the string passed in		// NAME?
		//		eg:   hope.walk( {a: { b: { c : 1} } }, "a.b.c") ==> 1
		//
		//	returns undefined if any step along the way is not defined
		//
		//	steps can either be:
		//		- "xxx()" 	in which case <newContext = context.xxx()>
		//					(NOTE: no arguments allowed!)
		//		- "xxx"  	in which case   <newContext = context.xxx>
		//
		walk : function walk(string, context, skipLevels) {
			if (string == null) return undefined;
			if (!context) context = window;
			
			if (typeof string == "number") return context[string];

			var path = string.split(".");
			
			// figure out where we should stop
			var last = path.length - (skipLevels || 0);
			
			// if back too far, return undefined
			if (last < 0) return undefined;

			// for each step in the path
			for (var i = 0; i < last; i++) {
				var step = path[i];
				if (step.endsWith("()")) {
					context = context[step.substr(0,step.length-2)]();
				} else {
					context = context[step];
				}
				if (context == null) return;
			}
			return context;
		},
	
		// similar to hope.walk(), but stops at the penultimate element in the chain
		walkToParent : function walkToParent(string, context) {
			return hope.walk(string, context, 1);
		},
		
		
		// Dereference a string or array in some context.
		// Default context is ClassFactory.Context
		//
		// What can be any of the following:
		//	- null							-- returns undefined
		//	- an object						-- returns the original object
		//	- a single string				-- returns the object in context or undefined
		//	- array of [string,object,...]	-- returns a NEW array of [object in context | string]
		//										(string iff object was not found in context)
		//
		//  Note: in array case, use    returned.all()   to inidicate if all are referenceable
		//	
		dereference : function dereference(what, context, dontRecurse) {
			if (what == null || what.length == 0) return what;

			// short-circuit by looking up in the list of known things
			// NOTE: in Moz at least,  array[["blah]]  is the same as  array["blah"]
			//			so if we get a match, check to see if we started from an array
			//			so we can make sure to return an array as well
			var thing = ClassFactory.LoadedThings[what.id||what];
			if (thing) return (what.join ? [thing] : thing);		// what.join == ghetto Array check

			if (!context) context = window;

			switch (typeof what) {
				case "string" : 
				case "number" : 
					return hope.walk(what, context);
					
				case "object" : 
					if (Object.isArray(what) && what.length && dontRecurse != true) {
						return what.collect(
							function(it) {
								return dereference(it, context, true);	// true == dontRecurse
							});
					}
					break;
			}
			return what;
		},

		legalizeId : function(id, maxLength, collection) {
			id = id.split(/[^\w\d]/mg).join("_");	// take out anything that's not a letter or digit
			var parsed = parseInt(id);
			if (id == ""+parsed) id = "_"+id;	// make sure doesn't start with a number

			// if they passed a maxLength, shorten to that
			if (maxLength) id = id.substr(0, maxLength);

			// if they passed a collection, make sure legal is unique within that collection
			if (collection && collection[id]) {
				var temp = id, sequence = 0;
				while (collection[temp+sequence]) {sequence++};
				id = temp+sequence;
			}
			return id;
		},



		// add some value to a collection
		//	(collections are  maps of arrays -- name???)
		addToListMap : function(collection, handle, value) {
			if (!value || !handle) return;
			if (!collection[handle]) collection[handle] = [];
			if (Object.isArray(value)) 	collection[handle].push.apply(collection, value);
			else						collection[handle].push(value);
		},
		
		addToListMaps : function(collection, handles, value) {
			if (!value || !handles) return;
			handles.each(function(handle) { addToListMap(collection, handle, value)});
		},


		//
		//	loading classes etc
		//

		urlToPath : function(url) {
			url = ""+url;
			if (url.indexOf("?")) url = url.substr(0, url.indexOf("?"));
			if (url.indexOf("#")) url = url.substr(0, url.indexOf("#"));
			var split = url.split("/");
			if (split.last() != "") url = url.substr(0, url.lastIndexOf("/"));
			return url;
		}
	});
	
	
	//
	//	TODO: move prototype extensions/patches into another file?
	//
	

	

	// register the "page:" namespace
	Loader.registerNamespace("page", hope.urlToPath(window.location));

	//
	// find the script tag that loaded hope.js
	//	and execute any inlined script within it
	//
	var hopeTag = $$("script[src*="+hope.hopeFileName+"]")[0];
	if (hopeTag) {
		// register the   "" namespace
		var path = hopeTag.getAttribute("src");
		Loader.registerNamespace("hope", path.substr(0, path.indexOf(hope.hopeFileName)));
	} else {
		console.error("hope.js initialization -- your script MUST be named "+hope.hopeFileName);
	}
	
	
	hope.loadedManifest = function(manifest) {
		if (manifest.preloads) {
			var includers = [Script];//, Expander, Stylesheet];
			manifest.preloads.forEach(function(entry) {
				if (!entry.id) return;
				includers.some(function(includer) {
					if (entry.url.indexOf(includer.fileExtension) > -1) {
						includer.included(entry.url);
						return true;
					}
				});
			});
		}
		
		if (manifest['namespace'] == "hope") {
			try {
				// install some ClassFactory methods in hope (preferred way of calling them)
				hope.delegate(hope, ClassFactory, "include includeSilently create when");
				
	//			// make sure all of the bootstrap urls have loaded properly
	//			bootstrapUrls.forEach(function(url) {
	//				Script.included(url);
	//			});
		
				// convert Loader to a full Singleton
				hope.create(Loader);
	
				// convert Cookie to a Singleton
				hope.create(Cookie);
	
				// convert Debuggable to a full Mixin
				hope.create(Debuggable);
	
		
				// if there are any things that have been waiting for us to load do them now
				if (ClassFactory.BootstrapCreates.length) {
					ClassFactory.BootstrapCreates.each(function(thing) {
						hope.create(thing);
					})
					delete ClassFactory.BootstrapCreates;
				}
			
				if (ClassFactory.BootstrapIncludes.length) {
					ClassFactory.BootstrapIncludes.each(function(args) {
						ClassFactory.include.apply(ClassFactory, args);
					})
					delete ClassFactory.BootstrapIncludes;
				}
							
				// execute (via eval()) any code in the hope script tag
				var initScript = hopeTag.innerHTML.strip();
				if (initScript) {
					try 		{	eval(initScript);	} 
					catch (e) 	{	throw("Error evaluating inline hope.js script: ",e); }
				}
	
				// load the hope stylesheet
				// NOTE: Stylesheet may not be created right away if it has any dependencies
				hope.when("Stylesheet", function() {
					Stylesheet.include("hope::hope.cssv");
				});
				
				hope.hideLoadingMessage();
	
			} catch (e) {
				console.error("error in hope.load(): ",e.message);
			}
		}
	}


} catch (e) {
	console.error("Error loading main hope script: ",e.message);
	console.trace(e);
}
} // end with (hope)
})();	// end hide from global scope



