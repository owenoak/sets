
	//
	//	MapOfLists -- Map of   key => [list]
	//
	//	Created here because we use this to implement our inheritance memorization scheme
	//
	ClassFactory.create({
		id : "MapOfLists", 
		superclass:"BaseClass",
		methods : {
			initialize : function (id, globalContext, itemConstructor) {
				this.id = id;
				this.globalContext = globalContext || hope.GlobalContext;
				this.itemConstructor = itemConstructor || Array;
				this.map = {};
			},
			
			get : function(key) {	
				return this.map[key] || (this.map[key] = new this.itemConstructor());	
			},
		
			add : function(key, toAdd, position) {
				toAdd = $split(toAdd);
				if (!toAdd) return this;

				var args;
				if (!Object.isArray(toAdd))	args = [toAdd];
				else						args = toAdd.clone();
		
				var list = this.get(key);
				if (args.length) {
					if (position == null) position = this.map[key].length;
					// add position to add to to the first spot in args array
					args.unshift(position, 0);
					this.map[key].splice.apply(this.map[key], args);
				}
				(hope.debug.maps && console.debug("===== hope.",this.id,".add(",key,"): ",toAdd,": is now ",this.map[key]));
				return this;
			},
			
			
			addFirst : function(key, toAdd) {
				return this.add(key, toAdd, 0);
			},
			
			clear : function(key) {
				(hope.debug.maps && console.debug("===== hope.",this.id,".clear(",key,")"));
				if (!this.map[key]) return [];
				return this.map[key].splice(0, this.map[key].length);
			}
		}
	});

	
	//
	//	set up structures we'll use for keeping track of Things as we load them
	//
	hope.Subs 				= new MapOfLists("Subs");				// map of "Super" => ["Sub","Sub","Sub"]
	hope.Supers				= new MapOfLists("Supers");				// map of "Sub" => ["Super","Super","Super"]
	hope.Requires			= new MapOfLists("Requires");			// map of "Sub" => ["Thing","Thing","Thing"]	// thing a requires b,c,d
	hope.RequiredBy			= new MapOfLists("RequiredBy");			// map of "Thing" => ["Sub","Sub","Sub"]		// thing a is required by b,c,d
	hope.ThingOnLoads		= new MapOfLists("ThingOnLoads");		// map of "Thing" => callbacks to execute when thing created
	hope.LocationsForThings = {};									// map of "Thing" => path to load that thing (only for things that need to be loaded)
