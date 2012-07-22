// TODO: why are random # properties being set on the target?

//
//	use		Conditional.applyTo(Class, "updater",
//					{	
//						conditions: {enabled:true, visible:true},
//						ontrue : "update",
//						onfalse : function(){this.log('skipping update')},
//						autoInit : true
//					});
//			var it = new Class();
//
//			if (it.updater.isTrue()) ...
//
//			it.updater.set("enabled",false);		//  fires onfalse function above
//			it.updater.set("enabled",true);			//	fires it.update()
//
//			it.updater.execute()					//  fires it.update() because condition is still true
//
//	params:
//		- id			-- name of the condtion (for assigning methods)
//		- condition 	-- ANONYMOUS function to evaluate to see if condition is true
//							  or
//						   map of <prop> to <value> we check against this
//
//		- autoInit		-- (default true) if true, we apply conditions to thisObject onApply
//							and start the timer if autoCheckInterval is set
//
//		- onTrue		-- method to exectute (on this) when condition is true
//
//		- onfalse		-- method to execute (on this) when condition is false
//
//		- executeOnChange -- (default true) if true, we execute onTrue or onFalse 
//								only when the condition's value is different that the last known value.
//								If false, we execute each time condition is checked.
//
//		- checkEvery	-- if set, number of SECONDS between which we automatically perform conditional check
//
//	TODO: 	- remember last value and only execute() when changed?
//			- check on timer
//			- verify thisObject semantics	-- assigning to proto, want on instance?
//




/*
//
//	example
//

Conditional.applyTo(SomeClass.protoype, "enableIf", {...props...});
var it = new SomeClass();
it.enableIf.setCondition({prop:value});
it.enableIf()					// checks and executes
it.enableIf(p,v)				// sets this[p,v] and fires if condition is true
it.enableIf.execute(boolean);	// executes onTrue or onFalse based on boolean
it.enableIf.check(p,v);			// return true or false based on conditonal state
it.enableIf.start(p,v);			// start interval
it.enableIf.stop(p,v);			// stop interval

*/

//C$.definePattern("Conditional", {
Conditional = {
	debug : false,
	
	// initialize the pattern
	initialize : function(props) {
		Object.extend.apply(Object, [this].concat(arguments));
	},

	
	patternMethods : {
		//
		//	check to see the condition specified currently holds
		//			this == target
		check : function(prop, value) {
			this.set(prop, value);
			var condition = this.condition;
			if (!condition) return true;
			if (typeof condition == "function") return condition();	// NOTE: explicitly NOT binding!
			if (condition && typeof condition == "object") {
				for (prop in condition) {
					if (this.target[prop] != condition[prop]) return false;
				}
			}
			return true;
		},


		//
		//	set one or more properties on the target
		//			this == conditional
		set : function setConditionalValue(prop, value) {
			if (!prop) return;
			if (typeof prop == "object" && value === undefined) {
console.warn("set",this.target, prop);
				Object.extend(this.target, prop);
			} else {
				this.target[prop] = value;
			}
		},

		//
		//	execute a callback
		//		this == conditional
		//
		execute : function executeConditionalCallback(conditionValue) {
			var callback = (conditionValue ? this.onTrue : this.onFalse);
			if (typeof callback == "string") callback = this.target[callback];
			if (typeof callback == "function") callback.apply(this.target);
		},
		

		//
		//	set a new condition property
		//		this == conditional
		//
		setCondition : function setCondition(newCondition) {
			var newParams = (newCondition ? { condition: newCondition } : null);
console.warn("setCondition",this.target, this.parms, newParams);
			Conditional.applyTo(this, this.id, this.params, newParams);
			return this.target;
		},
		

		//
		//	start and stop the timer
		//		this == conditional
		//
		start : function startConditionalTimer(prop, value) {
			this.set(prop, value);
			// if interval is already set up, or checkEvery is no defined, don't start
			if (!this.interval && this.checkEvery !== undefined) {
				this.interval = setInterval(this, this.checkEvery * 1000);
			}
// DEBUG: give them a warning if executeOnChange is true that they won't see updates unless something changes
			return this.target;
		},
		
		stop : function stopConditionalTimer(prop, value) {
			this.set(prop, value);
			clearInterval(this.interval);
			delete this.interval;
			return this.target;
		}
	},
	
	//
	//	NOTE: you can apply an already partially-applied Conditional.Params object
	//
	applyTo : function(it, id, params, params2) {
		// default params
		if (!params) params = {};
		if (params.autoInit === undefined) 			params.autoInit = true;
		if (params.executeOnChange === undefined) 	params.executeOnChange = true;
		if (params.condition === undefined)			params.condition = function(){ return true };
		
		// conditional is the method that is the root of all of the other methods in patternDefaults
		//	assign it based on whether we should fire onchange only or every time the conditional is checked
		// note the wierd reference to "conditional" in the body of the function
		var conditional = function conditional(prop, value) {
			// check old and new value and only execute if changed
			var newValue = conditional.check(prop, value);
			
			if (newValue == conditional.oldValue) {
				if (conditional.executeOnChange) return newValue;
			}
			conditional.oldValue = newValue;
			conditional.execute(newValue);
			return newValue;
		}
		
		// set condition.target to it
		conditional.target = it;
		conditional.id = id;
		
		// remember the params so we can re-apply on setCondition
		
		// apply the parameters and patternMethods to the conditional
		// TODO: take an unlimited # of params?
		hope.extend(conditional, Conditional.patternMethods, params, params2);


		// if autoInit == true and they specified properties, apply properties to it
		if (params.autoInit && typeof params.condition == "object") {
			hope.extend(it, params.conditions);
		}
	
		// set up the initialize method to automatically create a copy of the conditional
// TODO: only do this on a prototype!
		if (it.initialize) {
			var oldInitialize = it.initialize;
			it.initialize = function initializeInstance() {
// TODO: if instance[id] != conditional, treat as params?
								var returnValue = oldInitialize.apply(this, arguments);
								Conditional.applyTo(this, id, params, params2);
								return returnValue;
							};
		}
	
		// assign the conditional it under the params.id
		it[id] = conditional;
		
		return conditional;
	}

}




//);

// REFACTOR -- the below should happen automatically
Conditional.initialize();

