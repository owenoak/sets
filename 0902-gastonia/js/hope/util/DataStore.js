hope.create({
	id 			: "DataStore",
	superclass	: "BaseClass",
	requires	: "Cookie",				// TODO: some way to only require this if we get to the cookie provider?

	defaults : {
		id			: undefined,
		location 	: location.hostname || 'localhost',		// for globalStorage
		
		maxSize		: 64 * 1024,			// max size for DBs where we can set the size
											// 64KB is pretty safe for all storage formats 
											// other than cookie

		// SQL statements for gears, whatWG databases
		SQL : {
			version	: 1,	// schema version
			create	: "CREATE TABLE IF NOT EXISTS #{tableName} (key TEXT UNIQUE NOT NULL PRIMARY KEY, value TEXT NOT NULL)",
			get		: "SELECT value FROM #{tableName} WHERE key = ?",
			set		: "INSERT INTO #{tableName}(key, value) VALUES (?, ?)",
			clear	: "DELETE FROM #{tableName} WHERE key = ?",
			getAll	: "SELECT key, value FROM #{tableName} WHERE key = '*'"	// ??? syntax?
		}
	},
	
	methods : {
		// initialize the first storage provider that works
		initialize : function(params) {
			this.extend(params);
			
			for (var key in DataStore.providers) {
				var provider = DataStore.providers[key];
				if (!provider.test()) continue;
				
				// hook up the provider
				this.extend(provider);
				this.provider = key;
				
				// initialize according to our provider
				this.initializeStore();
				
				// and load data if necessary
				this.load();
				
				break;
			}
		},
		
		// methods common to all providers
		get : function(context, key) {
			key = this.escapeKey(context, key);
			var value = this._get(key);
			return this.unescapeValue(value);
		},
		
		set : function(context, key, value) {
			key = this.escapeKey(context, key);
			value = this.escapeValue(value);
			this._set(key, value);
			this.save();
		},
		
		clear : function(context, key) {
			key = this.escapeKey(context, key);
			return this._clear(key);
		},
	
		escapeKey : function(context, key) {
				if (typeof context != "string") context = context.globalRef || context.id || "";
				context += "::" + key;
			return escape(context);
		},
		
		escapeValue : function(value) {
			return escape(value);			// TODO: objects to JSON, etc
		},
		
		unescapeValue : function(value) {
			return unescape(value);			// TODO: JSON to objects, etc
		},
	
		// these may be overridden by an implementation
		initializeStore	: function() {},
		load 			: function() {},
		save 			: function() {}
	},	// end methods
	
	// list of possible storage providers we know about
	// we will try them in this order
	providers : {
		// globalStorage provider:  FF2+, IE8+
		globalStorage : {
			test : function() 			{	return window.globalStorage != undefined	},
			_get : function(key) 		{	return this.store[key]						},
			_set : function(key, value) {	return this.store[key] = value				},
			_clear : function(key) 		{	delete this.store[key]						},
			initializeStore : function(){	this.store = globalStorage[this.location]	}
		},
		
		// IE 5.5+
		// NOTE: in IE, this is apparently per URL, not per domain
		//	Create a top-level Iframe?
		behavior : {
			test : function() 			{	return window.ActiveXObject != undefined	},
			_get : function(key) 		{	return this.store.getAttribute(key) 		},
			_set : function(key, value) {	return this.store.setAttribute(key, value)	},
			_clear : function(key) 		{	return this.store(key, null);				},
			load : function() 			{	this.store.load(this.id)					},
			save : function() 			{	this.store.save(this.id)					},
			
			// initialize this storage provider
			initializeStore : function() {
				this.store = new Element("object");
				this.store.addBehavior("#default#userData");
				this.style.style.display = "none";
				// TEST: does it have to be appended?
				document.documentElement.appendChild(this.store);
			}			
		},
		
		// google gears provider
		//	http://code.google.com/apis/gears/api_database.html
		gears : {
			usingSqlStore : true,

			test : function() {	return window.google && window.google.gears != undefined	},
			
			_get : function(key) {
				var row = this.store.execute(this.SQL.get, [key]), value;
				if (row.isValidRow()) value = row.field(0);
				row.close();
				return value;
			},
			
			_set : function(key, value) {
				this._clear(key);
				this.store.execute(this.SQL.set, [key, value]).close();
			},
			
			_clear : function(key) {
				this.store.execute(this.SQL.clear, [key]).close();
			},
			
			initializeStore : function() {
				this.store = google.gears.factory.create('beta.database');
				this.store.open("hopePreferences");
				this.store.execute(this.SQL.create).close();
			}
		},


		// whatWGDB (WebKit, Safari 3.1+)
	    // (src: whatwg and http://webkit.org/misc/DatabaseExample.html)
		// NOTE: this is an asynchronous API
		//			so we cache the entire DB at initializeStore time (yuck!)
		whatWG : {
			usingSqlStore : true,
			
			test : function() {
				if (!window.openDatabase) return;
				
				// open a database -- this might fail if this domain is over its quota
				this.store = openDatabase(this.id, this.SQL.version, 
											"hope Preferences database", this.maxSize);
				return (this.store != null);
			},
			
			// store was already created above, initialize our table
			initializeStore : function() {
				var cache = this._cache = {};
				// TODO: should we push the create into the test in case it throws an exception?
				try {
					this.store.transaction(function(tx) {
						// create the table
						tx.executeSql(this.SQL.create, []);

						// NOTE: because the WhatWG API is asynchronous, 
						//			to simulate synchronous gets cache all data in locally
						tx.executeSql(this.SQL.getAll, [], function(tx, result) {
							for (var i = 0; i < result.rows.length; i++) {
								var row = result.rows.item(i);
								cache[row.key] = row.value;
							}
						});
					})
				} catch (e) {
					console.error(e);
				}
			},
						
			// get from the cache set up on initializeStore
			_get : function(key) {
				return this._cache[key];
			},
			
			_set : function(key, value) {
				this._clear(key, value);
				db.transaction(function(tx) { tx.executeSql(this.SQL.set, [key, value]) });
				this._cache[key] = value;
			},
			
			_clear : function(key) {
				db.transaction(function(tx) { tx.executeSql(this.SQL.clear, [key]) });
				delete this._cache[key];
			}
		},

		// cookie provider -- always works but can only store 4K of data
		//						and incurs server traffic
		cookie : {
			test : function() 			{	return true						},
			_get : function(key) 		{	return Cookie.get(key)			},
			_set : function(key, value) {	return Cookie.set(key,value)	},
			_clear : function(key) 		{	Cookie.clear(key)				},

			// warn that we can't store many preferences with the cookie storage provider
			initialize : function() {
				console.warn("Preferences: resorting to cookie storage provider.  "
					+ "Limit of < 4K for storage.");
			}
		}
	}	
});

