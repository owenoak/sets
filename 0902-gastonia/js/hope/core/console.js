
	//	"console" shim	
	//
	//	Set up basic console functions ala Firebug under the "console" global for all browsers.
	//		* if we detect "console.time()", we assume the full firebug API is present and bail
	//			(firebug, firebug lite and WebKit 4+).
	//		* Detects firebug lite properly and disables it if Firebug is present.
	// 		* In WebKit or IE with basic console, correctly maps firebug API onto native console.
	//		* If no console is present at all, creates a stubby-but-functional one 
	//			-- use  console.show() to show it on demand
	//
	try {
	(function(){		// (in anonymous function so we can bail if full firebug present)
		var hasFirebugAPI	= (window.console != null && console.time),
			hasFirebugLite 	= (window.firebug != undefined),
			hasConsole 		= (window.console != undefined)
		;
	
		// disable firebugLite if fireBug is present
		if (hasFirebugAPI && hasFirebugLite) 	firebug.env.detectFirebug = true;
		
		// and just bail entirely if fireBug or the console.time method is present
		if (hasFirebugAPI) return;
		var indent = "";
		// Patch versions of consoles, which have some console methods but not others and a different api.
		if (hasConsole) {
			var originalConsole = window.console;
			// WebKits: 	1.3+ have console.log, 
			//				3.1+ have log, info, warn, error
			//				4.0+ have full firebug API, so we shouldn't get here
			// IE 			v8 w/ Dev toolbar has log, info, warn, error, assert with different API
			window.console = {};
			"log info warn error debug".split(" ").forEach(function(name) {
				if (originalConsole[name]) 
					console[name] = function() {originalConsole[name](indent + $A(arguments).join(" "))};
			});
		}
		
		// if there is no console at all, make a little stubby-but-functional one
		// TODO: move this into another file
		if (!hasConsole) {
			var display = new Element("div", { id:"HopeConsole"});
			var executor = new Element("input", {id:"HopeConsoleExecutor"});
			var consoleStub = window.console = {
				_append : function(message, className) {
					var element = new Element("div", { className: "Message " + (className || "") });
					element.innerHTML = message;
					display.appendChild(element);
					display.scrollTop = 10000000;
				},
				log 	: function() {	consoleStub._append(indent + $A(arguments).join(" ")) },
				info 	: function() {	consoleStub._append(indent + $A(arguments).join(" "),"Info") },
				warn	: function() {	consoleStub._append(indent + $A(arguments).join(" "),"Warn") },
				error	: function() {	consoleStub._append(indent + $A(arguments).join(" "),"Error") },
				show : function() {
					if (!document.body) return setTimeout(console.show, 0);
					document.body.appendChild(display);
					document.body.appendChild(executor);
					executor.observe("keypress",function(event) {
						if (event.keyCode == 13) {
							consoleStub._append(">>>"+executor.value, "Executed");
							try {
								var result = eval(executor.value);
								consoleStub.log(result);
								executor.value = "";
							} catch (e) {
								consoleStub.error(e.message);
							}
						}
					});
					executor.focus();
					console.show = function(){display.style.display = executor.style.display = ""}
				},
				hide : function(){display.style.display = executor.style.display = "none"}
			}
	
			// DEBUG: show the console immediately
			console.show();
		}
		// map any console methods that don't exist to console.log
		"info warn error debug assert dir dirxml trace profile profileEnd count".split(" ")
			.forEach(function(name) {
				if (!console[name]) {
					console[name] = console.log;
				}
		});
		
		// make group/groupEnd use indentation to simulate firebug's group functionality
		if (!console.group) {
			var indentLevel = 0;
			function setIndent(level) {	
				indentLevel = level; indent = "";
				for (var i = 0; i < level; i++) indent += "=";
			}
			console.group 		= function(title) {	console.log(title+indent);	setIndent(++indentLevel);}
			console.groupEnd 	= function() 	  { setIndent(--indentLevel) }
		}
		
		// make console.time methods
		if (!console.time) {
			var timers = {};
			console.time = function(str) {
				timers[str] = new Date().getTime();
			}
			console.timeEnd = function(str) {
				var start = timers[str];
				if (start) console.log(str, ": ", (new Date().getTime() - start) + "ms");
			}
		}
		
		
		// TODO? 	* do time thing with console.time()/timeEnd()
		//		 	* do count thing with console.count()
		//			* do console.dir() and console.dirxml()
	})();
	} catch (e) { alert(e.message) }
	
	
	// add a 'list' method to iterate through a list
	console.list = function(array, property) {
		if (!array) return;
		if (typeof array == "string") return console.log(array);
		for (var i = 0; i < array.length; i++) {
			console.log(i+":", (property ? array[i][property] : array[i]));
		}
	}
	
	// add a 'show' method to show the unique properties of an object
	console.show = function(object, skipFunctions) {
		if (!object) return;

		console.group(object.toString());
		for (var key in object) {
			if (!object.hasOwnProperty(key)) continue;
			if (skipFunctions && typeof object[key] == "function") continue;
			console.log(key + ":", object[key]);
		}
		console.groupEnd();
	}
	
