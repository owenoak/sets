
//
//	Cookie object for getting/setting/examining cookies
//
//	Note: this will be initialized as a singleton later
//
window.Cookie = {
	id : "Cookie",
	superclass : "Singleton",
	
	get : function(name) {
		if (!document.cookie) return undefined;
		var match = (document.cookie || "").match(new RegExp(name+"=([^;]*)"));
		if (!match) return;
		var value = unescape(match[1]);
		if (value.charAt(0) == "{" && value.charAt(value.length-1) == "}")
			value = JSON.parse(value);
		return value;
	},
	
	set : function(name, value, expires) {
		if (value && typeof value == "object") value = JSON.stringify(value);
		if (value == "{}") return Cookie.clear(name, path, domain);
		var newCookie = name + "=" + escape(value) +
				((expires) ? "; expires=" + expires.toGMTString() : "")
		;

		document.cookie = newCookie;
		return window.Cookie.get(name);
	},
	
	clear : function(name, path, domain) {
		if (!hope.Cookie.get(name)) return;
		return window.Cookie.set(name, "", path, domain, new Date(0));
	}
};

