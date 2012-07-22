/*
	CSS Animation

	Animate one or more css style properties ("styles") from their starting position to specified ending positions.

	Implements Webkit-style css transitions in all modern browsers.
		see:  http://webkit.org/specs/CSSVisualEffects/CSSTransitions.html
	
	If browser supports (x-)transition* style property, uses that.
	Otherwise does manual setting of values via a timer.

*/

//
//	TODO: 
//			-- parse color values in setProperties for manual transitions
//			-- way to pull dynamically load one style or the other after executing
//				a test function?
//			-- for manual operation, scale the number of steps via the duration?
//
//	WEBKIT BUGS
//		- if element is already at end state, does not fire end event!
//

hope.create({
	id 			: "CSSAnimation",
	requires	: "Color",			// NOTE: only requires these if doing manual transitions
	defaults : {
		state				: "unstarted",	// one of: unstarted, running, finished
		element				: undefined,
		styles				: undefined,	// hash of key:newValue or css style of "key:value;key:value"
		transitionFunction 	: "ease",		// $w("ease linear ease-in ease-out ease-in-out"),
		duration 			: 1,			// <number> of seconds, "#s" or 
											//	"very fast", "fast", "normal", "slow", "very slow"
											//	"quickly", "very quickly", "slowly", "very slowly"
		callback			: undefined,	// callback to execute when done
		nextInChain			: undefined,	// animation to call when we're done
		autoStart			: true			// if true, we play immediately after creation
	},
	
	// methods common to both styles of animation
	methods : {
		initialize : function(element, styles, params, callback, autoStart) {
			this.extend(params);
			if (styles) this.setStyles(styles);
			if (callback) this.callback = callback;
			if (element) this.element = element;

			// start automatically if we're supposed to
			if (autoStart === undefined) autoStart = this.autoStart;
			if (autoStart) this.start();
		},

		// start the animation
		start : function(element, callback) {
			if (element) this.element = element;
			if (callback) this.callback = callback;
			
			if (!this.element) throw this+".start(): element not defined";
			if (!this.styles) throw this+".start(): styles not defined";

			// if we're already running, stop first
			if (this.state == "running") this.stop();


			// make a copy of the styles that we can munge
			this.endStyles = hope.extend({}, this.styles);

			this.element = $(this.element);
			this.startStyles = this.getCurrentStyles();

			// normalize the styles to handle special values like "center" or "max"
			this.normalizeStyles();

			// if an onStart handler is defined, call it now
			if (this.onStart) this.onStart();
			
			this.state = "running";

			// if duration is 0, jump to the end
			if (this.duration == 0) return this._skipToEnd();

			// if we're already at the end state, just end now
			if (this.matchesStyles(this.startStyles)) return this.stop(true);
			
			// call the implementation-dependent start method
			this._start();
			return this;
		},
		
		stop : function(skipClear) {
			// only perform the following once
			//	since the end function will be called for each property set in the transition
			if (this.state == "running") {
				if (skipClear != true) this._clear();
				if (this.callback) this.callback();
				if (this.onStop) this.onStop();
				if (this.nextInChain) this.nextInChain.start();
			}
			this.state = "finished";
			return this;
		},
		
		setNextInChain : function(nextAnimation) {
			this.nextInChain = nextAnimation;
			if (this.state == "finished") this.nextInChain.start();
			return nextAnimation;
		},
		
		normalizeStyles : function() {
			// if any end styles are "*", set them to the same value as the start style
			// TODO: will this work with the css transitions since there is no change?
			for (var key in this.endStyles) {
				var value = this.endStyles[key], offset;
				
				// skip non-number properties
				if (!CSSAnimation.numericProperties[key]) continue;

				// try parsing the value
				var parsed = parseFloat(value);

				// if it's a number or it has no units, add "px"
				if (typeof value == "number" || value == ""+parsed) {
					this.endStyles[key] = value + "px";
					continue;
				}
				// otherwise if it is a legal number, we're good
				if (!isNaN(parsed)) continue;
				
				// only calculate the following once for all keys
				if (!offset) {
					var offset = this.element.positionedOffset(),
						dims = this.element.getDimensions(),
						max = (this.element.parentNode == document.body 
									? document.viewport.getDimensions() 
									: this.element.parentNode.getDimensions())
					;
				}
					
				// normalize values
				switch (value) {
					case "*":		value = this.startStyles[key]; 
						break;
						
					case "left":
					case "top":		value = offset[value] + "px";
						break;
						
					case "width":
					case "height":	value = dims[value] + "px";
						break;
					
					case "center":	if 		(key == "left") value = (max.width - dims.width)/2 + "px";
									else if (key == "top")  value = (max.height - dims.height)/2 + "px";
									else throw "animation value 'center' only valid for left and top";
						break;

					case "max":		if 		(key == "width")  value = max.width + "px";
									else if (key == "height") value = max.height + "px";
						break;
					
					default : 		throw "Don't understand animation property "+key+" of '"+value+"'";
				}
				if (value == null)  delete this.endStyles[key];
				else				this.endStyles[key] = value;
			}
		},
		
		// skip to the end of the animation
		_skipToEnd : function() {
			this.element.setStyle(this.endStyles);
			this.stop(true);
		},


		getCurrentStyles : function() {
			var styles = {};
			for (var key in this.endStyles) {
				styles[key] = this.element.getStyle(key);
			}
			return styles;
		},

		matchesStyles : function(styles) {
			if (!styles) styles = this.getCurrentStyles();
			for (var key in this.endStyles) {
				var value = this.endStyles[key];
				if (this.endStyles[key] != styles[key]) return false;
			}
			return true;
		},

		//
		//	property normalizers
		//
		
		// TODO: normalize color values if doing manual animation
		setStyles : function(styles) {
			if (typeof styles == "string") styles = hope.parseStyle(styles);

			this.propertyCount = 0;
			// normalize styles
			for (var key in styles) {
				this.propertyCount++;
				
				var value = styles[key];
				
				if (CSSAnimation.numericProperties[key]) {
					// convert to a number if "px" or unspecified qty
					if (typeof value == "number") continue;
					var parsed = parseInt(value);
					if (value == ""+parsed || value == parsed+"px") {
						value = parsed;
					}
				
				} else if (CSSAnimation.colorProperties[key]) {
					// only need to change if we're in manual animation mode
					//	do put the converter there
					
				} else if (CSSAnimation.percentProperties[key]) {
					if (typeof value == "string") value = parseFloat(value);
					
					// handle either an integer between 0-100 or a float between 0-1
					if (value > 1) value = value / 100;
					// pin to 0-1
					value = value.max(0).min(1);
				}

				styles[key] = value;
			}

			// pick up any styles we specified
			if (this.styles) styles = hope.extendUnique(styles, this.styles);

			this.styles = styles;
		},
		
		// normalize duration to a float
		//
		setDuration : function(duration) {
			if (typeof duration == "string") {
				var namedValue = CSSAnimation.namedDurations[duration];
				if (namedValue != null) 
					return (this.duration = namedValue);
				else
					return (this.duration = 
							( 	 parseFloat(value) 
							  || CSSAnimation.namedDurations.normal));
			}
			this.duration = duration;
		}
	},

	// initialize the class
	initialize : function() {
		// test to see if a transition style property is supported
		this.transitionProperty = this.getCSSTransitionProperty();
		// 	if they are, we'll use transitionMethods to do the animation
		//	if not, we'll use the manualAnimationMethods
		var methods = this.transitionProperty 
						? CSSAnimation.transitionAnimationMethods
						: CSSAnimation.manualAnimationMethods;
		this.prototype.extend(methods);
		this.animationType = methods.animationType;
	},

	classDefaults : {
		manuallyRegister : true,
		
		transitionPrefixes		: $w("webkitTransition"),
		transitionProperties 	: $w("Property Delay Duration TimingFunction"),
		
		numericProperties 		: {left:1, top:1, right:1, bottom:1, fontSize:1, height:1, width:1},
		colorProperties 		: {backgroundColor:1, color:1},
		percentProperties 		: {opacity:1},
		
		propertySetTime			: .025,		// Number of seconds we estimate it will take 
											// to set a single property on an object.
											// TODO: some way of determining this dynamically?

		// named duration map expressed in seconds of time
		namedDurations	: {
			"immediate"		: 0,
			"very fast" 	: .2,
			"fast"			: .4,
			"normal"		: .6,
			"slow"			: 1,
			"very slow"		: 2,
			"very quickly"	: .2,
			"quickly"		: .4,
			"slowly"		: 1,
			"very slowly"	: 2
		},
		
		// methods for doing manual animations 
		//	(when css transition properties are not supported)
		manualAnimationMethods : {
			animationType : "manual",
			_start : function() {
				// divide the duration up according to the number of steps
				// TODO: figure out the stepDuration automatically?
				this.stepDuration = CSSAnimation.propertySetTime * this.propertyCount;
				this.stepCount = Math.max(1, Math.ceil(this.duration / this.stepDuration));
				this.stepCount--;	// we'll do the last step manually to prevent roundoff problems
				// if we're only doing one step, just jump right to the end
				if (this.stepCount == 0) return this._skipToEnd();
				this.currentStep = 0;

				// get the percent we should be along at each step
				// TODO: implement timingFunctions here!
				var stepPercents = [];
				for (var i = 0; i < this.stepCount; i++) {
					stepPercents[i] = i/this.stepCount;
				}
				
				// pre-calculate the values for each step
				this.stepList = {};
				for (var key in this.endStyles) {
					var startValue = this.element.getStyle(key),
						endValue = this.endStyles[key]
					;
					if (endValue == startValue) continue;
					this.stepList[key] = this._getStepList(stepPercents, key, startValue, endValue);
				}
				this.stepProps = {};
				
				// bind the event handler for the next step function
				this._nextStep = this._step.bind(this);
				
				this._step();
			},

			_step : function() {
				for (var key in this.stepList) {
					this.stepProps[key] = this.stepList[key][this.currentStep];
				}
				this.element.setStyle(this.stepProps);
				
				this.currentStep++;
				if (this.currentStep > this.stepCount) {
					this.element.setStyle(this.endStyles);
					return this.stop();
				}
				this._stepTimer = setTimeout(this._nextStep, this.stepDuration);
			},
			
			_clear : function() {
				clearTimeout(this._stepTimer);
			},		
			
			// return the list of values to set the property to for each step
			_getStepList : function(stepPercents, property, startValue, endValue) {
				if ( CSSAnimation.numericProperties[property] ) {
					// NOTE: assumes startValue and endValue are in the same units (DANGEROUS)
					startValue = parseInt(startValue);

					var units = "px";
					if (typeof endValue != "number") {
						if (endValue.indexOf("%") > -1) {
							units = "%";
						} else if (endValue.indexOf("em") > -1) {
							units = "em";
						}
						endValue = parseInt(endValue);
					}
					return this._getNumericStepList(stepPercents, property, startValue, endValue, units);
				} 
				else if (CSSAnimation.percentProperties[property]) {
					return this._getNumericStepList(stepPercents, property, startValue, endValue, units);
				} 
				// color property
				else {
					return this._getColorStepList(stepPercents, property, startValue, endValue);
				}
			},
			
			_getNumericStepList : function(stepPercents, property, start, end, units) {
				var delta = (end - start),
					list = []
				;
				// TODO: do timingFunction here!
				for (var i = 0; i < this.stepCount; i++) {
					list[i] = start + (delta * stepPercents[i]);
				}

				// tack units on to the end if necessary
				if (units) {
					list.forEach(function(value, index) {
						list[index] = list[index] + units;
					});
					if (typeof this.endStyles[property] == "number")
						this.endStyles[property] = this.endStyles[property] + units;
				}

				list.type = "number";
				return list;
			},
			
			_getColorStepList : function(stepPercents, property, start, end) {
				start = new Color(start);
				end = new Color(end);
				
				var list = [];
				for (var i = 0; i < this.stepCount; i++) {
					list[i] = start.tween(end, stepPercents[i]).toHex();
				}

				list.type = "color";
				return lists;
			}
		},
		
		// methods for doing animation via css "transition" properties
		transitionAnimationMethods : {
			animationType : "cssTransition",
			_start : function() {
				var styles = this.endStyles,
					duration = this.duration + "s",
					transitionFunction = this.transitionFunction,
					prefix = CSSAnimation.transitionPrefix
				;
				// set the end function up
				this.element.addEventListener( prefix+'End', this.stop.bind(this) );
				
				// build the transition string
				var transition = [];
				for (var key in styles) {
					transition.push(key + " " + duration + " " + transitionFunction);
				}
				this.element.style[prefix] = transition.join(",");

				// just set the element styles to the end styles
				//	'cause CSS magic handles the rest
				this.element.setStyle(this.endStyles);
			},
				
			// clear all of the transition properties off of the element
			_clear : function() {
				var element = this.element,
					prefix = CSSAnimation.transitionPrefix
				;
				CSSAnimation.transitionProperties.forEach(function(suffix) {
					element.style[prefix+suffix] = "";
				});
			}
		}
	},

	classMethods : {
		// Return the name of the css transition property that this browser supports.
		//	If the browser does not support any transition property, 
		//	returns undefined as a flag that manual transitions are necessary
		getCSSTransitionProperty : function() {
			var el = new Element("div");
			var prefixes = this.transitionPrefixes;
			for (var i = 0; i < prefixes.length; i++) {
				var key = prefixes[i];
				el.style[key] = "1s width ease-in";
				if (el.style[key+"property"]) return key;
			}
		}
	}

});