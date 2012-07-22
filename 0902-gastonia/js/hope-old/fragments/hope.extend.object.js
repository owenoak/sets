hope.extend(hope, 
	{

		//
		//	Object manipulators, similar to Protoype's Enumerable methods but for keys of an object
		//
		//	NOTE: they skip properties in hope._mapSkipProps
		//
		_mapSkipProps : {"constructor":true,"prototype":true,"toString":true},
		
		// run callback for each key in it, returning object of key=>callback value 
		//	for ALL values (whether null or not)   (see also: Object.subset)
		map : function (it, callback, ifNonNull) { 
			var set = {}; 
			for (var key in it) {
				if (hope._mapSkipProps[key]) continue;
				set[key] = callback(it[key], key);
			} 
			return set; 
		},
	
		// run callback for each key in it, returning object of key=>callback value 
		//	for ONLY values returned which are not null or undefined
		//
		//	Returns null if none were found
		subset  : function (it, callback) { 
			var set = {}, found = false;
			for (var key in it) { 
				if (hope._mapSkipProps[key]) continue;
				var newValue = callback(it[key], key); 
				if (newValue != null) {
					set[key] = newValue;
					found = true;
				}
			} 
			return (found ? set : null); 
		},
		
		each    : function (it, callback) { hope.collect(it, callback); return it; },
		pluck   : function (it, property) { return hope.map(it, function (value) { return value} ) },
		
		isEmpty : function (it) {
			for (var prop in it) {
				if (it[prop] != null) return false;
			}
			return true;
		},
		compact : function(it) {
			var results = {}, found = false;
			for (var prop in it) {
				if (it[prop] == null) continue;
				results[prop] = it[prop];
				found = true;
			}
			return (found ? results : null);
		}
		
		
	});
	hope.select = hope.subset;
	hope.where = hope.subset;
	hope.collect = hope.map;
	
	
	
