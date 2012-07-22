		includeScriptImmediately : function(path) {
			var callback;
			
			if (hope.debug.include) {
				console.info(">>>> loading script "+path, " >>>>");
				callback = function(){console.info("<<<< done loading script "+path,"<<<<")};
			}
	
			function errback(request, error) {
				console.error("**** Error loading '"+path+"': ", e);
			}

			new Ajax.Request(path, {
				method : "GET",
				asynchronous : false,
				onException : errback,
				onFailure : errback,
				onSuccess : function loadSucceeded(request) {
					try {
						var script = request.responseText;
						eval(script);
						if (callback) callback();
					} catch (e) {
						errback(null, e);
					}
				}
			});
		}