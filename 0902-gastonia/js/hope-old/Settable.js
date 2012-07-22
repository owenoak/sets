
		Getters : {},
		getterName : function (key) {
			return hope.Getters[key] || hope.suffixize("get",key, hope.Getters);
		},


		Setters : {},
		setterName : function (key) {
			return hope.Setters[key] || hope.suffixize("set",key, hope.Setters);
		},


		//
		//	setter normalization pattern
		//	-- assume that when we're setting values, we normalize them
		//		so that when we're getting them we can do normal property
		//		access, and don't have to do getFoo()
		//	-- to faciliatate this, we have a smart set() routine which calls
		//		our normalizing setters automatically if defined,
		//		otherwise just does a normal assign
		
		//	ASSUMES method is called on 'this'
		//
		setProperties : function(key, value) {
			// if a single object arg, assume it is a set of properties to check
			if (arguments.length == 1 && typeof key == "object") {
				var props = key;
				for (var key in props) {
					var setter = this[ (Getters[key] || getterName(key) ) ];
					if (typeof setter == "function") 	setter.apply(this, props[key]);
					else								this[key] = props[key];
				}
			} else {
				var setter = this[ (Getters[key] || getterName(key) ) ];
				if (typeof setter == "function") 	setter.apply(this, props[key]);
				else								this[key] = props[key];
			}
		},

