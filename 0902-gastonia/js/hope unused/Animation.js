// 	TODO: 	- add easing functions
//			- on initialize class, test to see if CSS animations work, 
//				then load subclass?
//
hope.create({
	id			: "Animation",
	
	defaults 	: {
		easing			: "linear",		// TODO: support others here

		stepCount		: 5,			// number of steps to perform
		stepDelay 		: .2,			// delay IN SECONDS between steps (0 == fast as possible)
		element			: undefined,	// element to affect
		callback		: undefined		// method to call when finished
	},
	
	methods : {
	
		initialize : function(params, callback, element) {
			this.extend(params);

			if (callback) this.callback = callback;
			if (element) this.element = $(element);
			
			// TOTHROW: throw if element is not defined
			this.begin();
		},
		

		// TODO: easing functions here
		getProgress : function() {
			return this.currentStep / this.stepCount;
		},
		
		play : function(step) {
			if (step != null) this.currentStep = step;
			
			this.currentStep--;
			
			if (this.currentStep > 0) {
				this.step(this.getProgress());
				this._stepTimer = setTimeout(this._replay, this.stepDelay * 1000);
			} 
			else {
				this.end();
				if (this.callback) this.callback();
			}
		},


		stop : function() {
			clearTimeout(this._stepTimer);
			this.end();
			// TODO: clean up things?
		},


		// your subclasses should implement the following:

		begin : function() {
			// bind the function that will be called in the timer
			this._replay = this.play.bind(this);
			// ...
		// do any setup you need to do
			// ...
			this.play(this.stepCount);
		},
	
		// Execute a single step of the animation.
		//	<progress> (number) is a float from 0-1 for the current progress in the animation.
		step : function(progress) {},
		
		// animation is done, do any cleanup etc
		end : function() {}
	
	},
	
	classDefaults : {
		Styles : {}
	},

	classMethods : {
		create : function(style, params, callback, element) {
			var constructor = this.Styles[style.toLowerCase()];
			if (!constructor) throw "animation style "+style+" not understood";
			return new construtor(params, callback, element);
		},
		
		// create a new Animation type and store it in our list of styles
		register : function(key, params) {
			if (!params.superclass) params.superclass = "Animation";
			if (!params.id) params.id = key;
			var constructor = hope.create(params);
			this.Styles[key.toLowerCase()] = constructor;
		},
		
		alias : function(key, superclass, params) {
			if (typeof superclass == "string") 
				superclass = Animation.Styles[superclass.toLowerCase()];

			if (params) {
				params.superclass = superclass;
				Animation.register(key, params);
			} else {
				this.Styles[key.toLowerCase()] = superclass;
			}
		}
	}

});

Animation.register("Show", {
	initialize : function() {
		Animation.alias("On", "Show");
	},
	defaults : {
		steps : 0
	},
	methods : function() {
		end : function() {
			this.element.style.display = "";	// TODO: default style?
		}
	}
});

Animation.register("Hide", {
	initialize : function() {
		Animation.alias("Off", "Hide");
	},
	defaults : {
		steps : 0
	},
	methods : function() {
		end : function() {
			this.element.style.display = "none";
		}
	}
});



Animation.register("FadeIn", {
	initialize : function() {
		Animation.alias("FadeOn","FadeIn");
	},
	methods {
		begin : function() {
			// TODO: if already visible, no-op?
			this.element.setOpacity(0);
			this.element.style.display = "";	// TODO: default style?
		},
		
		step : function(progress) {
			this.element.setOpacity(progress);
		},
		
		end : function() {
			this.element.setOpacity(100);
		}
	}
})

Animation.register("FadeOut", {
	initialize : function() {
		Animation.alias("FadeOff","FadeOut");
	},
	methods {
		begin : function() {
			// TODO: if already invisible, no-op?
			this.element.setOpacity(100);			// assumes that it is visible
		},
		
		step : function(progress) {
			this.element.setOpacity(progress);
		},
		
		end : function() {
			this.element.setOpacity(0);
			this.element.style.display = "none";
		}
	}
})