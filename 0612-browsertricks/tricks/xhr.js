

// Generic code to return an XHR object for this particular browser.
// Scheme is that we try all known methods for different browsers, returning the first that worked.
// When this succeeds, we the short-circuit the process so the one that worked will be called immediately next time.
getXHRObject = function() {
	methods = [
		function(){return new XMLHttpRequest()}, 					// all except IE
		function(){return new ActiveXObject('Msxml2.XMLHTTP')},		// different versions of IE
		function(){return new ActiveXObject('Microsoft.XMLHTTP')},
		function(){return new ActiveXObject('Msxml2.XMLHTTP.4.0')}
	];
	for (var i = 0, xhrMethod; xhrMethod = methods[i++];) {
		try {
			var xhr = xhrMethod();
			// It worked! Replace the global function with the correct one and return the XHR.
			window.getXHRObject = xhrMethod;
			return xhr;
		} catch (e) {}
	}
	throw new Error("getXHRObject: Could not get XHR object for this browser");
}
