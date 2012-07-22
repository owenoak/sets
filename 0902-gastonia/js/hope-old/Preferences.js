//
//	Methods for implementing preferences in an object
//		(e.g. states that are remembered and can be re-loaded later)
//
ClassFactory.create({
	id : "Preferences", 
	superclass:"Mixin",
	initialize : function() {
		hope.extend(hope.Cookie, hope.Preferences.cookieMethods);
		
		// set up aliases for a couple of functions
		hope.Cookie.setValue = hope.Cookie.addValue;
		hope.Cookie.clearValue = hope.Cookie.removeValue;
	},
	
	//
	//	methods for dealing with one cookie with multiple 'values'
	//
	//	Mixed in to hope.Cookie on Preferences.initialize()
	//
	cookieMethods : {
		_valuesFor : function(name) {
			var values = hope.Cookie.get(name);
			if (!values) return [];
			return values.split("|").compact();
		},
	
		_setValuesFor : function(name, valueList, path, domain) {
			var value = valueList.join("|");
			if (!value) return hope.Cookie.clear(name, path, domain);
			return hope.Cookie.set(name, value, path, domain);
		},
		
		addValue : function(name, value, path, domain) {
			var values = hope.Cookie._valuesFor(name);
			if (values.indexOf(value) != -1) return hope.Cookie.get(name);
			values.push(value);
			return hope.Cookie._setValuesFor(name, values, path, domain);
		},
		
		removeValue : function(name, value, path, domain) {
			var values = hope.Cookie._valuesFor(name),
				index = values.indexOf(value)
			;
			if (index == -1) return hope.Cookie.get(name);
			cookie.splice(index, 1);
			return hope.Cookie._setValuesFor(name, values, path, domain);
		},
		
		hasValue : function(name, value) {
			var values = hope.Cookie._valuesFor(name);
			return (values.indexOf(value) > -1);
		},
		
		// pass one or more values:
		//	if value is preceeded by "+", we will always add
		//	if value is preceeded by "-", we will always remove
		//	otherwise, we will add if present, remove if not present
		toggleValues : function(name, newValues, path, domain) {
			var values = hope.Cookie._valuesFor(name);
			for (var i = 0; i < newValues.length; i++) {
				var value = newValues[i],
					adding = undefined,
					removing = undefined
				;
				if (value.charAt(0) == "+") {
					value = value.substr(1);
					adding = true;
				} else if (value.charAt(0) == "-") {
					removing = true;
					value = value.substr(1);
				}
				var index = values.indexOf(value);
				if (!adding && !removing) {
					adding = (index == - 1);
					removing = !adding;
				}
				if (adding && index == -1) values.push(value);
				if (removing && index > -1) values.splice(index, 1);
			}
			return hope.Cookie._setValuesFor(name, values, path, domain);
		}
	
	},

	methods : {
		hasCookie : function(value, setGlobally) {
			if (!this.cookieId) return;
			var path = (setGlobally ? undefined : window.location.pathname);
			return Cookie.hasValue(this.cookieId, value, path);
		},
		
		addCookie : function(value, setGlobally) {
			if (!this.cookieId) return;
			var path = (setGlobally ? undefined : window.location.pathname);
			return Cookie.addValue(this.cookieId, value, path);	
		},
		
		removeCookie : function(value, setGlobally) {
			if (!this.cookieId) return;
			var path = (setGlobally ? undefined : window.location.pathname);
			return Cookie.removeValue(this.cookieId, value, path);	
		},
	
		toggleCookies : function(values, setGlobally) {
			if (!this.cookieId) return;
			var path = (setGlobally ? undefined : window.location.pathname);
			return Cookie.toggleValues(this.cookieId, values, path);
		}
	}
});