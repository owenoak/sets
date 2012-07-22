(function () {
with (ClassFactory) {
	//
	//	ClassFactory is what you'll use to actually create instances of Classes, Mixins, etc
	//
	//	Use ClassFactory to create to ensure that loaded dependencies are set up before
	//	your Thing initializes, and to register your class for reflection, etc.
	//
	hope.extend(ClassFactory, {
	
		// "Thing" => Things which have been initialized already
		LoadedThings : {},
	
		// id => uninstantiated thing for things that are waiting on dependencies to load
		DeferredThings : {},
		
		// "Thing" => [callback,...] to execute when thing finishes loading
		OnLoads : {},
	
		// "RequiredThing" => ["Requirer","Requirer",...] -- listing things which are required by the key thing
		Requirers : {},


		// execute callback when thing id is initialized
		when : function(id, callback) {
			return include(id, callback);
		},

		// load one or more script files by Id, executing callback when done
		// returns true if all are loaded, or ids of things still to be loaded
		include : function(ids, callback, forWhat) {
			// split the ids into a list and normalize them
			ids = Loader.normalizeIds(ids);
//			(hope.debug.include && console.info("ClassFactory.include(",ids,")  callback:",callback));

			var unloaded = ids.filter(function(id, index) {
				var present = (LoadedThings[id] || hope.dereference(id));
				if (present) return;
				hope.addToListMap(OnLoads, id, callback);
				return id;
			});
			
			if (unloaded.length) {
				(hope.debug.include && 
					console.info("ClassFactory.include(",ids,")" + (forWhat ? "for "+forWhat : "")
							+": need to include ",unloaded));
				Script.include(unloaded);
				return unloaded;

			} else {	// all loaded!
				(hope.debug.include && 
					console.info("ClassFactory.include(",ids,")" + (forWhat ? "for "+forWhat : "")
							+ ": everything is loaded"));
				if (callback) callback();
				return true;
			}
		},


		// include a thing silently (eg: return undefined so this can be used in a href URL or on the cmd line)
		includeSilently : function(stuff, callback) {
			include(stuff, callback);
		},
			
	
		create : function(params) {
			(hope.debug.create && console.group("hope.create("+params.id+")"));
			
			if (params.superclass == null) params.superclass = "hope::BaseClass";
			
			// Check to see if our dependencies have already loaded
			//	If they have not, checkDependencies() will cause them to be loaded
			//	and us to be added to the queue of things that need to be created() later
			//
			//	NOTE: this normalizes many properties to streamline checks later
			var dependenciesLoaded = ClassFactory.checkDependencies(params);
			if (dependenciesLoaded) {
				var superclass = hope.dereference(params.superclass), thing;
	
				if (superclass && superclass.isASingleton) 
						thing = ClassFactory._createSingleton(params, superclass);
				else	thing = ClassFactory._createClass(params, superclass);	

				(hope.info.create && console.info("created ",thing.id, " : ",thing));
			}
			(hope.debug.create && console.groupEnd());
			return (thing || dependenciesLoaded);
			
		},


		// Returns true iff all params.superclass, params.mixins and params.requires are already loaded
		//	Also loads any Expanders and Stylesheets if necessary.
		checkDependencies : function (params) {
			// if already loaded, nothing to do
			if (LoadedThings[params.id]) {
				(hope.debug.create && console.info("checkDependencies(",
							(params.id),") -- already loaded"));
				return true;
			}

			// if we haven't already been put in the 'waiting' queue
			//	normalize all of our dependencies and such
			var initializing = !ClassFactory.DeferredThings[params.id];
			if (initializing) this.initializeDependencies(params);
			// check all the things left to check
			var allLoaded = (this._checkThingsToCheck(params) == null);

			(hope.debug.create && 
				console.debug("ClassFactory.checkDependencies(",params.id,"):",
					(allLoaded 	 ?  " dependencies are all loaded!"
								 :  " dependencies are not loaded: "+ params.thingsToCheck
					)
			));

			// if there are files left to check, stick us in the list of DeferredThings
			ClassFactory.DeferredThings[params.id] = (allLoaded ? null : params);
			return allLoaded;
		},

		_checkThingsToCheck : function(params) {
			if (!params.thingsToCheck) return;
			var toCheck = params.thingsToCheck;
			params.thingsToCheck = [];
			for (var i = 0, id; id = toCheck[i++];) {
				if (LoadedThings[id] == null && hope.dereference[id] == null)
					params.thingsToCheck[params.thingsToCheck.length] = id;
			}
			if (params.thingsToCheck.length == 0) delete params.thingsToCheck;
			return params.thingsToCheck;
		},

		// initalize the dependencies for a newly-seen set of params
		_normalizeProps : $w("id superclass requires mixins classMixins expanders styles"),
		initializeDependencies : function(params) {
			// normalize all of the key properties
			var anyFound = false;
			for (var i = 0, key; key = this._normalizeProps[i++];) {
				var value = params[key];
				if (value) {
					if (value.indexOf(" ") == 0)	value = Loader.normalizeId(value);
					else {
						value = Loader.normalizeIds(value);
						if (value && value.join && value.length == 1) value = value[0];
					}
				}
				
				if (!value) delete params[key];
				else 		anyFound = params[key] = value;
			};
			if (!anyFound) return;

			// debug
			if (hope.debug.create) {
				(params.superclass && console.debug(params.id," wants superclass: ", params.superclass));
				(params.requires && console.debug(params.id," requires: ", params.requires));
				(params.mixins && console.debug(params.id," wants mixins: ", params.mixins));
				(params.classMixins && console.debug(params.id," wants classMixins: ", params.classMixins));
				(params.expanders && console.debug(params.id," wants expanders: ", params.expanders));
				(params.styles && console.debug(params.id," wants styles: ", params.styles));
			}

			// load any stylesheets immediately
			if (params.styles) Stylesheet.include(params.styles);

			// get all the required things
			params.thingsToCheck = [].merge(params.superclass, params.requires, params.mixins, params.classMixins);
			// perform the initial check now on the scripts supers
			this._checkThingsToCheck(params);

			// if there are still somethings to check, include them now
			if (params.thingsToCheck) ClassFactory.include(params.thingsToCheck, null, params.id);

			// if there are any expanders to load, start that off now
			//	(this will update params.thingsToCheck as well)
			if (params.expanders) ClassFactory._loadExpanders(params);
			
			// and add them to the Requirers list maps so 
			//	we will be notified when they finish loading
			if (params.thingsToCheck) hope.addToListMaps(Requirers, params.thingsToCheck, params.id);
		},
		
		// load any expanders and update params.thingsToCheck
		_loadExpanders : function(params) {
			var expanders;
			// include the expanders -- this returns id(s) of anything that is NOT loaded
			expanders = Expander.include(params.expanders);
			if (expanders) {
				if (typeof expanders == "string") expanders = [expanders];
				// stick the expanders in the list of things to check by id+extension
				expanders = expanders.map(function(id){return id+Expander.fileExtension});
				params.thingsToCheck = (params.thingsToCheck || []).concat(expanders);
			}
		},
		
		// properties we copy from the params to our constructor below
		_singletonMaskProps : {	
					id:1, mixins:1, classMixins:1, requires:1, 
					expanders:1, styles:1, prototype:1,
					initialize:1	
			},

		// intialize a Singleton, Factory, Mixin or Pattern
		// NOTE: we will only get here if our dependencies have already been loaded
		_createSingleton : function(params, superclass) {
			(hope.debug.create && 
				console.info("ClassFactory_createSingleton(", params, ") superclass:", superclass));
			
			// actually create the singleton
			var singleton = hope.protoClone(superclass, true);
			// mask some properties from the superclass
			hope.maskProtoProperties(singleton, this._singletonMaskProps);
			
			// set up superclass and subclasses ala prototype,
			singleton.superclass = superclass;
			singleton.subclasses = [];
			singleton.protoChain = superclass;

			// HACK for mixins and descendants
			//	Merge "methods" and "defaults" from superclass
			if (superclass.isAMixin) {
				if (params.methods && superclass.methods) 
					params.methods = hope.protoClone(superclass.methods, params.methods);
				if (params.defaults && superclass.defaults) 
					params.defaults = hope.protoClone(superclass.defaults, params.defaults);
			}

			// add all of the params to the singleton
			ClassFactory.superize(singleton, params);
			
			if (!singleton.manuallyRegister) singleton.Instances = singleton.subclasses;

			// NOTE: mixins must apply cleanly, not overriding properties that are there!
			// NOTE: mixins and classMixins are really the same for a singleton
			if (params.mixins) ClassFactory.applyMixins(singleton, params.mixins);
			if (params.classMixins) ClassFactory.applyMixins(singleton, params.classMixins);

			ClassFactory.registerThing(singleton, superclass);
			if (params.initialize && params.initialize != singleton.initialize) params.initialize.apply(singleton);
			if (singleton.initialize) singleton.initialize();

			// note that we've been included
			ClassFactory.included(singleton.id);

			// execute any onloads waiting for us to finish
			ClassFactory.executeOnLoads(singleton.id);

			(hope.debug.create && console.info("CREATED singleton ",singleton,"!"));
			return singleton;
		},
		
		
		// properties we copy from the params to our constructor below
		_classCopyProps : $w("id mixins requires methods defaults"),

		// create a Class 
		// NOTE: we will only get here if our dependencies have already been loaded
		// NOTE: superclass is dereferenced already
		_createClass : function(params, superclass) {
			(hope.debug.create && console.debug("ClassFactory._createClass(",params,") superclass:",superclass));
			
			// actually create the constructor
			var constructor = ClassFactory.__createConstructor(params, superclass);
			
			// register and initialize the constructor
			ClassFactory.registerThing(constructor, constructor.superclass);
			if (params.initialize) params.initialize.apply(constructor);
			if (constructor.initialize) constructor.initialize();
			
			// note that we've been included
			ClassFactory.included(params.id);

			// execute any onloads waiting for us to finish
			ClassFactory.executeOnLoads.delay(0, params.id);
			
			(hope.debug.create && console.info("CREATED class ",constructor,"!"));
			return constructor;
		},
		
		_getConstructor : function() {
			return function(){
				this.initialize.apply(this, arguments);
			}
		},
		
		// based on Prototype.js, which is
		//   "Based on Alex Arnell's inheritance implementation."
		__createConstructor : function(params, superclass) {
			var manuallyRegister = (	params.manuallyRegister == true 
								     || (superclass && superclass.manuallyRegister == true)),
				constructor
			;
			if (false) {
				constructor = function() {
					this.initialize.apply(this, arguments);
				}

			} else {
				constructor = function() {
					this.initialize.apply(this, arguments);
					ClassFactory.registerInstance(this,null,true);
				}
			}

			// set up the prototype
			if (superclass) {
				// get a clone of the super's prototype WITHOUT calling init
				constructor.prototype = hope.protoClone(superclass.prototype);
				superclass.subclasses.push(constructor);
				constructor.protoChain = superclass;
				constructor.prototype.protoChain = superclass.prototype;
			} else {
				constructor.prototype = { };
			}


			// point to our superclass, subclasses and Instances
			constructor.superclass = superclass;
			constructor.subclasses = [];

			if (!params.manuallyRegister) constructor.Instances = [];
			constructor.id = params.id;

			// assign the constructor manually 
			//	since we actually created the prototype with an anonymous function
			constructor.prototype.constructor = constructor;

			// remember all of the initParams for debugging
			constructor.initParams = params;
			
			// set up the class methods and defaults
			// 		(just apply the differences from the superclass to pick up their props)
			hope.extendUnique(constructor, superclass);
			ClassFactory.superize(constructor, params.classMethods);
			ClassFactory.superize(constructor, params.classDefaults);

			// now assign defaults and methods to the prototype
			ClassFactory.superize(constructor.prototype, params.defaults);
			ClassFactory.superize(constructor.prototype, params.methods);

			// apply mixins to the prototoype
			if (params.mixins) ClassFactory.applyMixins(constructor.prototype, params.mixins);
			if (params.classMixins) ClassFactory.applyMixins(constructor, params.classMixins);
		
			// toString method added for debugging
			constructor.toString = function(){return this.id};
		
			return constructor;
		},



		// mixins should be id(s)
		applyMixins :  function(thing, mixins) {
			(hope.debug.create && console.error("applying mixins ",mixins," to ",thing.id || thing));
			if (typeof mixins == "string") mixins = [mixins];
			mixins.forEach(function(id) {
				var mixin = hope.dereference(id);
				if (!mixin) return;	// TOTHROW
				if (mixin.isAClass) return;		// classes are inserted another way

				// if the super has an applyTo method, call that
				if (mixin.applyTo) {
					(hope.debug.create && console.debug("applying ",mixin.id, "'",mixin,"' to",thing));
					mixin.applyTo(thing);

				// otherwise just add the properties of the mixin to the thing
				} else {
					(hope.debug.create && console.debug("extending all properties of ",mixin," to",thing));
					ClassFactory.superize(thing, mixin);
				}
			});
		},

		// execute any onload handlers waiting for us to finish loading
		executeOnLoads : function(id) {
			if (OnLoads[id]) {
				(hope.debug.create && console.group("executing onloads for ",id,": ",OnLoads[id]));
				OnLoads[id].tryExecuting("Error executing onLoad callback for "+id);
				(hope.debug.create && console.groupEnd());
			}
			delete OnLoads[id];
		},

	

		// Note that loading of something has completed, initialize any subs/requires/onloads.
		// Use this if you have a file which is not a class which you're trying to load.
		included : function(id, thing) {
			if (!LoadedThings[id]) LoadedThings[id] = thing || true;
			var requirers = Requirers[id];
			if (!requirers) return;
			
			requirers.forEach(function(requirer, index) {
				if (typeof requirer == "string") requirer = DeferredThings[requirer];
				if (requirer) {
					(hope.debug.create && console.debug("included(",id,"): re-creating ",requirer));
					return create(requirer); 
				}
				if (!LoadedThings[requirers[index]]) 
					throw "included("+id+"): requirers"+requirers[index]+" not found"
							+" in DeferredThings or LoadedThings";
			});

		},
		
		// include failed somehow
		includeFailed : function(id) {
			// NOT DOING ANYTHING AT THE MOMENT...
		},
		
		// NAME?
		register : function(id, thing) {
			Loader.addToNamespace(id, thing);
			ClassFactory.included(id);
		},
		
		// set up reflection naming for the thing
		registerThing : function(thing, parent) {
			// register as an instance of parent
			//	this will ensure we have an id, and add us to parent.Instances
			if (parent) ClassFactory.registerInstance(thing, parent);
			
			delete ClassFactory.DeferredThings[thing.id];
			ClassFactory.LoadedThings[thing.id] = thing;

			// get the globalRef for the thing
			thing.globalRef = Loader.idToGlobalRef(thing.id);
			
			thing.instanceSequence = 0;

			// stick it in the namespace
			Loader.addToNamespace(thing.id, thing);
			
			var name = Loader.idToName(thing.id);
			// figure out the isAThing for this thing
			var identifier = ("AEIOUaeiou".indexOf(name.charAt(0)) == -1 ? "isA" : "isAn") + name;
			thing[identifier] = true;
			if (typeof thing == "function" && thing.prototype) thing.prototype[identifier] = true;
			if (thing.classDefaults) thing.classDefaults[identifier] = true;
			Object[identifier] = function(it) { 
				return it && (it[identifier] || (it.constructor && it.constructor[identifier]))
			}
		},
		
		// Register an instance with its parent (generally its constructor).
		// Ensures that the instance has an id, globalRef and instanceId
		//	Do NOT pass true to initialize if calling this again 
		//		-- that would add instance to Instances by number more than once
		registerInstance : function(instance, parent, initialize) {
			if (!parent) parent = instance.constructor;
			if (initialize == true) {
				// make up an id if we don't have one already
				if (!instance.hasOwnProperty("id")) {
					var name = Loader.idToName(parent.id) || "unknown",
						id = name.charAt(0).toLowerCase() 
								+ name.substr(1) 
								+ "_" 
								+ parent.instanceSequence++
					;
					if (instance.setId) instance.setId(id);
					else instance.id = id;
				
				}
				
				if (parent.Instances) {
				// stick us in the parent.Instances by sequence
					parent.Instances.push(instance);
		
					// make sure we have a legal id	for the instance which is unique
					// (note: we're capping legalId length to 64 chars)
					var legalId = hope.legalizeId(instance.id, 64, parent.Instances);
	
					// stick us in the Instances by legalId
					parent.Instances[legalId] = instance;
			
					// make sure we have a globalRef
					if (!instance.hasOwnProperty("globalRef")) 
						instance.globalRef = parent.globalRef + ".Instances." + legalId;
				}
			}
			// stick us in the instances array by id
			if (parent.Instances)	parent.Instances[instance.id] = instance;
			return instance.id;
		},
		
		
		Setters : {},
		getSetter : function(key) {
			return (Setters[key] = "set" + key.charAt(0).toUpperCase() + key.substr(1));
		},
		
		//
		//	Superize -- extend an object intelligently, merging functions and objects.
		//
		//	For each key in params (as value):
		//		- If there is a custom setter (it.set<Key>), calls it.set<Key>(value).
		//		- If the value is a function and first parameter is $super,
		//			wraps it[key] with params[key].
		//		- If the value is an object and it[key] is also an object
		//			merges the objects together (via _superizeObject).
		//
		superize : function(it, params, override) {
			if (!params) return it;
			for (var key in params) {
				var value = params[key], 
					setter = ClassFactory.Setters[key] || ClassFactory.getSetter(key)
				;
				if (typeof it[setter] == "function") {
					it[setter](value);
					continue;
					
				} else if (typeof value == "function" && firstArgIs$super(value)) {
					it[key] = ClassFactory._superizeMethod(it, key, value);
					continue;
					
				} else if (typeof value == "object" && it.hasOwnProperty(key)) {
					it[key] = ClassFactory._superizeObject(value, it[key]);
					continue;
				}
				if (override != false || !it.hasOwnProperty(key)) it[key] = value;
			}
			return it;
		},


		// NOTE: no error checking on this -- make sure all parameters are passed
		_superizeMethod : function(it, key, method) {
			var prototype = it.protoChain || it.constructor.prototype,	
				originalMethod = it[key] || (prototype ? prototype[key] : null)
			;
			(hope.debug.superize 
				&& console.info("_superizeMethod()\n\t\tkey:",key,"  method:",method,
								"\n\t\tit:",it.id||it,"  prototype:",prototype, 
								"\n\t\toriginal:", originalMethod, " hasOwn:", it.hasOwnProperty(key)));
			
			// if it has its own method, wrap that directly
			if (it.hasOwnProperty(key)) {
				(hope.debug.superize && console.debug("                  -- has own property"));
				return function() {
					var me = this, args = $A(arguments);
					args.unshift(function() {return originalMethod.apply(me, arguments)});
					return method.apply(me, args);
				}

			// if it no original method, no prototype or proto does not have the function,
			//	just curry in the no-op function
			} else if (originalMethod == null || !prototype || !prototype[key]) {
				(hope.debug.superize && console.debug("                  -- no method or prototype"));
				return method.curry(hope.noop);
				
			} else {
				(hope.debug.superize && console.debug("                  -- wrapping prototype function"));
				return function() {
					var me = this, args = $A(arguments);
					args.unshift(function() { return prototype[key].apply(me, arguments) });
					return method.apply(me, args);
				}
			}
			return $super.wrap(method);
		},

		_superizeObject : function(master, sub) {
			return hope.extend({}, master, sub);
		},

	
		superizeList : function(it, paramList) {
			// NOTE: manual for-loop here so this can be called with an arguments array
			if (!paramList) return;
			for (var i = 0, len = paramList.length; i < len; i++) {
				if (paramList[i]) ClassFactory.superize(it, paramList[i]);
			}
			return it;
		}		
		
	});// ClassFactory.extend()


	// regex to see if first argument of function is $super
	// use this so we can do a string.search to figure out if we need to superize
	//	rather than the slower function.argumentNames() from Prototoype
	var superChecker = /^[\s\(]*function[^(]*\(\s*\$super[ ,\)]/;
	function firstArgIs$super(method) {
		if (method instanceof RegExp || method.length == 0) return false;
		var string = Function.prototype.toString.apply(method);
		return (string.search(superChecker) == 0);
	}

	
	/////////
	//
	//	Create our BaseClass and base of Singleton, etc chains
	//
	/////////


	//
	//	Base of all classes created by the ClassFactory
	//

	// call _createClass to get around the dereferenced checking
	(hope.debug.create && console.group("ClassFactory.create(hope::BaseClass)"));
	ClassFactory.BaseClass = _createClass({
		id 			: "hope::BaseClass",
		identifier 	: "isAClass",

		defaults : {},

		methods : {
			
			// empty initialize function (so we can ensure one is present)
			initialize : function noop() {},
			
			setId : function(id) {
				if (id) this.id = id;
				return ClassFactory.registerInstance(this);
			},
			
			// extend instances
			extend : function() {
				return ClassFactory.superizeList(this, arguments);
			},

			// 	Defer -- execute some method in a little bit.
			//
			//	<methodName> (string) Name of method to invoke.
			//	<args> (array, optional) Arguments to method.
			//	<delay> (number, optional) Number of *seconds* to delay.
			//
			//	Note: If you call defer() a second time before the first time executes, 
			//			it stops the old timer and starts a new one.  
			//			Any arguments passed to the first invocation will be lost.
			//
			defer : function(methodName, args, delay) {
				if (!this._Timers) this._Timers = {};
				clearTimeout(this._Timers[methodName]);
				var me = this,
					wrapper = function() {
						clearTimeout(this._Timers[methodName]);
						this[methodName].apply(this, $A(args));
					}.bind(this);
				;
				return this._Timers[methodName] = setTimeout(wrapper, (delay || 0) * 1000);
			},

			
			toString : hope.toString
		},
		
		classMethods : {
			byId : function(id, createIfNotFound) {
				if (this.Instances[id]) return this.Instances[id];
				if (createIfNotFound)   return new this({id:id});
			},
			
			extendPrototype : function() {
				return ClassFactory.superizeList(this.prototype, arguments);
			},
			
			extend : function() {
				return ClassFactory.superizeList(this, arguments);
			}
		}
	});	
	(hope.debug.create && console.groupEnd("ClassFactory.create(hope::BaseClass)"));
	
	

	//
	// Base of all non-Class Things (Singleton, Factory, Mixin and Pattern objects)
	//
	(hope.debug.create && console.group("ClassFactory.create(hope::Singleton)"));
	ClassFactory.registerThing({
		id				: "hope::Singleton",
		isASingleton	: true,
		superclass		: null,
		subclasses		: [],
		toString 		: hope.toString,
		
		extend 			: function() {
			return ClassFactory.superizeList(this, arguments);
		}
	})
	Singleton.Instances = Singleton.subclasses;
	(hope.debug.create && console.info("CREATED singleton hope::Singleton!"));
	(hope.debug.create && console.groupEnd("ClassFactory.create(hope::Singleton)"));
	
	//
	//	Base of all Factories
	//
	ClassFactory.create({
		id : "Factory",
		superclass : "Singleton"
	});
	
	
	//
	//	Base of all Mixins and Patterns
	//
	ClassFactory.create({
		id	: "Mixin",
		superclass : "Singleton",
		applyTo : function(it) {
			if (!it) return;
			
			if (it.extend)  it.extend(this.defaults, this.methods);
			else 			hope.extend(it, this.defaults, this.methods);
		}
	});
	


	//
	//	Base of all Patterns  (based on Mixin)
	//
	ClassFactory.create({
		id	: "Pattern",
		superclass : "Mixin"
	});
	
};// end with (ClassFactory)
})();	// end function(){}   (scope hider)



// DEBUG: put a shorter version in the window context
window.CF = ClassFactory;

