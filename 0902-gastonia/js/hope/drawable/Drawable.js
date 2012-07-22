// missing from old lib:
//	- cookie support ('preference' mixin)
//
//	Review API
//	- names of draw routines
//	- setProperties -- why is this different from extend?  which should we keep?
//	- layout stuff? -- sizers, etc?
//	- redraw animation?  mixin?
hope.create({
	id			: "Drawable",
	superclass	: "BaseClass",
	mixins		: "Debuggable",
	styles 		: "simple.cssv",
	expanders 	: "simple.expanders",
	requires	: "CSSAnimation AnimationStyle",
	tagName		: "Drawable",		// tag name for auto-instantiation from HTML

	defaults : {

		id			 		: undefined,		// globally unique id string for widget -- should be unique on page.
												// Soft convention is that the outer element of 
												//  the widget will have attribute id == this.id.

		name 				: undefined,		// Name attribute for us (for our controller to identify us)
												
		parentSelector		: "BODY",			// Used to find parent element (if not passed on draw).
		autoDraw			: false,			// If true, we will draw after this.initialize().

		enabled				: true,				// default to enabled
		visible				: true,				// default to visible
		
		templateId			: "Drawable",		// outer template for drawing
		className			: "",				// css class name for $element
		style				: "",				// css style for $element
		
		showAnimation		: undefined,		// AnimationStyle to use when showing
		hideAnimation		: undefined,		// AnimationStyle to use when hiding

		$element			: undefined,		// Main (outer) element for the widget
		
		eventHandlers		: undefined,		// object of key:method handlers to be hooked up
												// on our outer element

		round				: undefined,		// "small","medium","large","huge"

		attributes : "",												
		elementAttributes   : $w("id className style events round")		
												// element attributes we should put on our outer element
	},
	
	methods : {
		// Initialize the widget.
		//
		//	Default convention is that we take a single object with properties that are
		//	added to this object via this.setProperties().
		//
		//	Note: you will generally override this.setProperties() rather than this.initialize().
		//
		initialize : function(properties) {
			this.initProperties = properties;		// remember our initial draw properties
			this.setProperties(properties);
			
			// if we have a controller, set us as one of their descendants
			if (this.controller && this.name) this.controller.addDescendant(this.name, this);

			// draw immediately if <this.autoDraw == true>
			if (this.autoDraw) this.defer("draw", 0);
		},
		
		// Set properties passed in on this object.
		//	This calls object.extend, which will:
		//		- call any custom setters if defined,
		//		- $superize any functions with $super arguments, and
		//		- merge any object properties
		//
		// You will typically override this rather than <this.initialize()>.
		//
		setProperties : function(properties) {
			this.extend(properties);
		},


		setId : function(id) {
			if (id == this.id) return false;
			if (id != null) this.id = id;
			if (this.$element) this.$element.setAttribute("id", id);
			return true;
		},


		//////
		//
		// 	Draw cycle.
		//
		//////
		
		// Begin the draw cycle.
		//
		//	<parent> (optional) is either a parent element or selector to get a parent element.
		//		If not passed, we consult <this.parentSelector> to find the parent 
		//		(which defaults to the BODY).
		//
		//	Returns <true> if we actually drew, <false> if drawing was deferred.
		//
		//	Note that we may not draw immediately when this is called:
		//		- If parent can't be found, we will defer until it can be found.
		//
		// Note: you generally will not override this 
		//	-- you will typically override prepareToDraw(), drawWidget() or afterDraw().
		//
		draw : function(parent) {
			// if we've already been drawn, redraw instead
			if (this.$element) return this.redraw();
			
			// get the parent (either the one passed in or from our parentSelector)
			parent = this.getParentElement(parent);
			
			// if we couldn't find parent, defer for a tiny bit
			if (!parent) {
				(this.debug.draw && !parent && 
					console.info(this, ".draw(): Deferring draw because parent not found"));
				// figure out the delay time and draw again in a little bit
				this.defer("draw", [parent], 0);
				// clear drawDelay so we don't delay next time
				this.drawDelay = null;
				return this;
			}
			// otherwise draw now
			else return this._drawNow(parent);
		},
		
		_drawNow : function(parent) {
			(this.debug.draw && console.group(this, ".draw(): Drawing"));

			this.prepareToDraw(parent);
			var element = this.drawMainElement();
			if (!this.visible) element.style.display = "none";
			parent.appendChild(this.$element);
			
			this.afterDraw();
			
			(this.debug.draw && console.groupEnd());
			return this;
		},
		
		
		// although the following are stubs, mixins may extend any of them
		//	so you should go ahead and <$super()> to them.
		
		// Prepare to do the actual drawing -- massage/normalize values, etc.
		prepareToDraw : function(parent) {},
		
		// Draw the actual element(s) for the widget.
		// Note: you should set this.$element to the main (outer) element.
		// The default behavior is to expand our outerTemplate if one was defined.
		drawMainElement : function() {
			if (!this.templateId) 
				return console.error(this,".drawMainElement(): must set this.templateId"
										 +" or implement custom drawMainElement()");
			var template = Expander.byId(this.templateId);
			if (!template) 
				return console.error(this,".drawMainElement(): template '"
										 + this.templateId+"' not found");
				
			return (this.$element = template.toElement(this));
		},
		
		// Do any cleanup after draw
		afterDraw : function() {
			if (!this.enabled) this.setEnabled();
		},
		

		//////
		//
		// 	Redraw cycle.
		//
		//////

		// Begin redraw cycle.
		//
		// note: you generally will not override this 
		//	-- you will typically override this.prepareToDraw(), this.drawWidget() or this.afterDraw()
		redraw : function(properties) {
			if (properties)	this.setProperties(properties);

			if (!this.$element) return this.draw();
			
			(this.debug.draw && console.group(this, ".redraw(): redrawing"));
			this.prepareToRedraw();
			this.redrawElement();
			this.afterRedraw();
			(this.debug.draw && console.groupEnd());
		},
		
		// Prepare to do actual redraw.
		prepareToRedraw : function() {},
		
		// Do the actual redraw of our element(s).
		//	If the main element has changed (because it's been replaced), set <this.$element>.
		redrawElement 	: function() {},
		
		// Do any cleanup after redrawing.
		afterRedraw		: function() {},
		


		// Schedule a redraw at some point in the near future.
		//	Call this rather than calling redraw() directly if a bunch of things
		//	may change in the display and you only want to redraw once for all of them.
		//
		//	NOTE: due to the nature of this.defer(), only one redraw event can be outstanding
		//	at any given time, so you can call this many times without worrying about it.
		//			
		scheduleRedraw : function(properties) {
			if (properties) this.setProperties(properties);

			(this.debug.draw && console.info(this, ": Deferring redraw"));
			this.defer("redraw");
		},



		//////
		//
		// 	Event handling
		//	
		//	By default, we allow you to set mouse and keyboard events on the outer element
		//	by setting the appropriate "onmousedown" or "onkeypress" etc property of your
		//	outer element.  We do this by assigning a simple, static function to the element
		//	when it is being drawn which points back to us.  This way you do not need to worry
		//	about releasing the event handlers later.
		//
		//////
		
		_makeEventHandler : function (name) {
			return this.globalRef + "." + name + "(event||window.event, this)";
		},
	
		addEventHandler : function (name, method) {
			if (!this.hasOwnProperty("eventHandlers")) 
				this.eventHandlers = (this.eventHandlers ? hope.protoClone(this.eventHandlers) : {});

			this.eventHandlers[name] = method;
			this[name] = method;

			if (this.$element) {
				this.$element[name] = new Function("event,target", this._makeEventHandler(name));
			}
		},
		
		outputEventHandlers : function () {
			var handlers = this.eventHandlers;
			if (!handlers) return "";
			
			var output = [];
			for (var name in handlers) {
				var method = handlers[name];
				this[name] = method;
				output.push(name+'="' + this._makeEventHandler(name) + '"');
			}
			return output.join(" ");
		},
		
		setOnmouseup : function(handler) {
			this.addEventHandler("onmouseup", handler);
		},

		setOnmousedown : function(handler) {
			this.addEventHandler("onmousedown", handler);
		},

		setOnmousemove : function(handler) {
			this.addEventHandler("onmousemove", handler);
		},

		setOnclick : function(handler) {
			this.addEventHandler("onclick", handler);
		},

		setOnmouseover : function(handler) {
			this.addEventHandler("onmouseover", handler);
		},

		setOnmouseout : function(handler) {
			this.addEventHandler("onmouseout", handler);
		},

		setOnkeydown : function(handler) {
			this.addEventHandler("onkeydown", handler);
		},

		setOnkeypress : function(handler) {
			this.addEventHandler("onkeypress", handler);
		},

		setOnkeyup : function(handler) {
			this.addEventHandler("onkeyup", handler);
		},


		



		//////
		//
		// 	value manipulation
		//
		//////
		
		setValue : function(value) {
			if (value == this.value) return false;
			this.value = value;
			return true;
		},	



		//////
		//
		// 	enabled manipulation
		//
		//////
		
		// Pass true or false to set enable.
		//	It will manipulate our element only if there is actually a change.
		// Pass undefined to force setting our state to the current state.
		//
		//	Returns true if there was actually a change.
		setEnabled : function(enabled) {
			if (enabled == this.enabled) return false;
			if (enabled !== undefined) this.enabled = (enabled == true);
			this.enabled = (enabled != false);
			if (this.$element) {
				this.$element.setAttribute("disabled", !this.enabled);
			}
			return true;
		},
		
		enable : function() {
			return this.setEnabled(true);
		},
		
		disable : function() {
			return this.setEnabled(false);
		},


		//////
		//
		// 	visible manipulation
		//
		//////

		// Pass true or false to set visible.
		//	It will manipulate our element only if there is actually a change.
		// Pass undefined to force setting our state to the current state.
		//
		//	Returns true if there was actually a change.
		setVisible : function(visible, callback, skipAnimation) {
			if (visible == this.visible) return false;
			if (visible !== undefined) this.visible = (visible == true);
			if (this.$element) {
				var animation = this[(this.visible ? "showAnimation" : "hideAnimation")];
				if (animation) {
					this[animationName] = this.animate(animation, callback);
				} else {
					if (this.visible) 	this.$element.style.display = "";
					else				this.$element.style.display = "none";
					if (callback) callback();
				}
			}
			return true;
		},
		
		show : function() {
			return this.setVisible(true);
		},
		
		hide : function() {
			return this.setVisible(false);
		},


		//////
		//
		// 	Class name manipulation
		//
		//////
		
		setClassName : function(className) {
			if (Object.isArray(className)) className = className.join(" ");
			if (className == this.className) return false;
			this.className = className;
			if (this.$element) this.$element.className = className;
			return true;
		},
		
		hasClassName : function(className) {
			var classes = this.className.split(/s+/);
			return (classes.indexOf(className) > -1);
		},
		
		addClassName : function(className) {
			return this.toggleClassName(className, "add");
		},
		
		removeClassName : function(className) {
			return this.toggleClassName(className, "remove");
		},
		
		toggleClassName : function(className, action) {
			var classes = this.className.split(/s+/);
			var index = classes.indexOf(className);
			if (!action) action = (index > -1 ? "remove" : "add");

			if (action == "add" && index == -1) {
				classes.push(className);
			} else if (action == "remove" && index != -1) {
				classes.splice(index, 1);
			}
			return this.setClassName(classes.join(" "));
		},
		
		
		//////
		//
		// 	CSS style manipulation
		//
		//////
		
		// set style as a string -- this is kinda disingenous as it won't clear styles already set
		setStyle : function(style) {
			if (this.style == style) return false;
			this.style = style;
			if (this.$element) this.$element.setStyle(style);
			return true;
		},



		//////
		//
		// 	Sizing
		//
		//		TODO: take box model into account
		//
		//
		//////
		getSize : function() {
			if (this.$element) return this.$element.getDimensions();
			return {width:-1,height:-1};
		},

		setSize : function(width, height) {
			if (typeof width == "object" && height == null) {
				height = width.height;
				width = width.width;
			}
			this.setWidth(width);
			this.setHeight(height);
		},
		
		setWidth : function(width) {
			if (width != null) this.$element.width = (typeof width == "number" ? width + "px" : width);		
		},

		setHeight : function(height) {
			if (height != null) this.$element.height = (typeof height == "number" ? height + "px" : height);		
		},
		
		getWidth : function() {
			if (this.$element) return this.$element.getWidth();
			return -1;
		},

		getHeight : function() {
			if (this.$element) return this.$element.getWidth();
			return -1;
		},
		


		//////
		//
		// 	Animation 
		//
		//		We only allow one animation to run at a time,
		//			so if a second wants to start, we stop the running animation first.
		//
		//////
		
		animate : function(animation, callback, element) {
			if (!animation) return null;
			
			if (this._currentAnimation && this._currentAnimation.state == "running") {
				this._currentAnimation.stop();
			}
			if (!element) element = this.$element;
			
			if (typeof animation == "string") {
				try {
					animation = AnimationStyle.parse(animation, element, callback, false);
				} catch (e) {
					console.error(this,".animate():", e);
				}
			}

			return (this._currentAnimation = animation.start(null, callback));
		},
		
		//////
		//
		// 	Element manipulation methods.
		//
		//////

		// Get our parent element.
		//	If we've already been drawn, returns the (extended) parentNode of our main element.
		//	If parent passed in, handles string selector and/or actual element.
		//	If no parent passed in, returns first match for our parentSelector
		//		(default parentSelector is body, so generally this means append to the body).
		getParentElement : function(parent) {
			if (this.$parent) return this.$parent;
			
			if (this.$element) return $(this.$element.parentNode);
			if (parent) {
				if (typeof parent == "string") this.parentSelector = parent;
				else return $(parent);
			}
			if (this.parentSelector) return $$(this.parentSelector)[0];
		},
		
		
		// output the attributes that should go in our outer element
		getAttributes : function() {
			var output = [];
			this.elementAttributes.forEach(function(key) {
				var value = this[key];
				if (value == null || value == "") return;
				if (key == "className") key = "class";
				output.push(key + "=\"" + value + "\"");
			}, this);
			
			if (this.attributes) output.push(this.attributes);
			return output.join(" ");
		}
	}

});