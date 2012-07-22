


		

		//	an Inheritable is a simple object which will automatically re-instantiate itself
		//	 in initInstance() to be-a-copy-of-but-have-a-protoype-pointer-back-to 
		//	 its prototype value of the same name
		//
		//	Basic property of an Inheritable is that when an instance is created and extendInstance()
		//		is called on it, the instance will be cloned via the constructor passed in to createInheritable
		createInheritable : function(id, constructor, initializer) {
			if (hope.Inheritables[id]) throw ("hope.createInheritable(",id,",",constructor,"): "
												+"Inheritable has already been created");
			
			// clone the original constructor

				// this one will NEVER be assigned a prototype
			var noProtoConstructor = function(args) {
					var it = new constructor(args);
					initializer.apply(it, [args]);
					return it;
				},
			
				// this will ALWASYS get a prototype before new()
				protoConstructor = function(args) {
					var it = new constructor(args);
					initializer.apply(it, [args]);
					return it;
				}
			;
			
			function initInstance(instance, key, args) {
				var constructor = noProtoConstructor,
					proto = (instance && instance.constructor.prototype)
				;
				if (proto && proto[key].constructor.isInheritable) {
					constructor = protoConstructor;
					constructor.prototype = proto[key];
				}
				return new constructor(args);
			}
	
			// set up properties of both constructors 
			noProtoConstructor.initInstance = protoConstructor.initInstance = initInstance;
			noProtoConstructor.isInheritable = protoConstructor.isInheritable = true;
		
			// register the inheritable		
			hope.Inheritables[id]  = noProtoConstructor;
			hope.GlobalContext[id] = noProtoConstructor;
			
			return hope.Inheritables[id];
		},





	hope.createInheritable("Options", function(){}, 
			function initInstance(instance, key, options) {
				// make sure that there is a setter routine for each of the options passed in
				hope.Options.createOptionsAccessors(instance, options);
				// now call the setter for each option value passed in
				for (var key in options) {
					var setter = hope.Options.getSetterFor(instance, key);
					debugger;
					setter.apply(instance, [options[key]]);
				}
			}
	);
	hope.extend(hope.Options, {

		_setters : {},
		_getters : {},
		createOptionsAccessors : function(it, options) {
			for (var key in options) {
				this.getGetterFor(it, key);
				this.getSetterFor(it, key);
			}
			return this;
		},
		getGetterFor : function(it, key) {
			var getter = _GetterNames[key] || (_GetterNames[key] = "get"+key.initalCap());
			if (it[getter]) return it[getter];
			var method = Options._getters[key];
			if (!method) {
				method = Options._getters[key] 
					   = function(){return this.options[key]};
			}
			return method;
		},

		getSetterFor : function(it, key) {
			var setter = _SetterNames[key] || (_SetterNames[key] = "set"+key.initalCap());
			if (it[setter]) return it[setter];
			var method = Options._setters[key];
			if (!method) {
				method = Options._setters[key] 
					   = function(value) {this.options[key] = value; return this;}
			}
			return method;
		},
		
		initInstance : function initInstance(instance, key, options) {
			// make sure that there is a setter routine for each of the options passed in
			hope.Options.createOptionsAccessors(instance, options);
			// now call the setter for each option value passed in
			for (var key in options) {
				var setter = hope.Options.getSetterFor(instance, key);
				debugger;
				setter.apply(instance, [options[key]]);
			}
		}
	
	});






		



		// Extend an instance with a list of properties (e.g. property arguments to a constructor)
		//	Only assigns property if (props[key] !== prototype[key]).
		//	Skips "prototype" and "constructor" properties.
		//
		//	If any Super properties.constructors have an 'initInstance' routine
		//		we guarantee that those will be invoked,
		//		either with the property passed in from list of the same value
		//		or without any properties
		//
		// 	NOTE: list MUST be an Array!  ???
		extendInstance : function extendInstance(instance, list, startIndex, proto) {
			if (!proto) proto = instance.constructor.prototype;
			// merge the props from the list
			var props;
			if      (list.length == 0) 	props = {};
			else if (list.length == 1) 	props = list[0];
			else						props = hope.extendList({}, list, startIndex);
	
			// pull out the subset of properties of the super which have 
			//		value.constructor.initiInstance set to true
			var protoInits = hope.where(proto, function(value, key) {
				if (value == null || key == "protoype" || key == "constructor" || key == "toString") return;
				value = value.constructor.initInstance;
				if (typeof value == "function") return value;
			});
			// for each item in the combined props
			for (var key in props) {
				if (key == "prototype" || key == "constructor") return;
				var value = props[key], method = (!protoInits || key == "toString" ? null : protoInits[key]);
				if (method) {
					value = method.apply(instance, [instance, key, value]);
					delete protoInits[key];
				}
				if (value !== proto[key]) instance[key] = value;
			}
	
			// now apply any protoInits that we missed above
			hope.each(protoInits, function(method, key) {
				instance[key] = method.apply(instance, [instance, key, null]);
			});
		},