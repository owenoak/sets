//
//	Container is a Drawable that manages a set of children
//
hope.create({
	id			: "Container",

	superclass	: "Drawable",
	tagName		: "Container",		// tag name for drawing the class

	defaults : {
		templateId				: "Container",		// outer template for drawing
		children 				: undefined,
		childContainerSelector  : undefined
	},
	
	methods : {

		//////
		//
		// 	Draw cycle.
		//
		//////

		
		// Draw our children after we draw
		afterDraw : function() {
			this.$childContainer = this.getChildContainer();
			if (this.children) this.drawChildren();
			if (!this.enabled) this.setEnabled();
		},
		
		// redraw our children after we redraw
		afterRedraw : function() {
			if (this.children) this.redrawChildren();
		},



		//////
		//
		// 	Manipulating children
		//
		//////
	
		setChildren : function(children) {
			if (!children || !children.length) return;
			children.forEach(function(child) {
				this.addChild(child);
			}, this);
		},
	
// TODO: add child at a specific index
		addChild : function(child) {
			if (!this.children) this.children = [];
			if (typeof child != "string") child.parent = this;
			this.children.push(child);
			if (this.$element) this.drawChild(child, this.children.length - 1);
		},
		
		// TODO: how to specify removal of text nodes???
		removeChild : function(child) {
			var index = this.children.indexOf(child);
			if (index == -1) return;
			
			this.children.splice(index,1);
			try {
				if (this.$element && child.$element) this.$element.removeChild(child.$element);
			} catch (e){}
		},
	
		// tell our children to draw
		drawChildren : function() {
			this.forEachChild(this.drawChild);
		},

		drawChild : function(child, index) {
			if (typeof child == "string") 	this.$element.appendChild(document.createTextNode(child));
			else if (child.$element)		this.$element.appendChild(child.$element);
			else							child.draw(this.$childContainer);
		},

	
		// tell our children to redraw
		redrawChildren : function() {
			this.forEachChild("redraw", null, true);
		},
		
		
		forEachChild : function(method, args, skipTextNodes) {
			if (!this.children || !this.children.length) return;
			if (typeof method == "string") {
				this.children.forEach(function(child, index) {
					if (child[method]) child[method].apply(child, args);
				});
			} else {
				this.children.forEach(function(child, index) {
					if (typeof child == "string" && skipTextNodes) return;
					method.call(this, child, index, args);
				}, this);
			}
		},
		

		//////
		//
		// 	enabled manipulation
		//
		//////
		
		// tell children to enable themselves
		setEnabled : function($super, enabled) {
			if (!$super(enabled)) return false;
			this.forEachChild("setEnabled", [enabled], true);
		},
		
		
		//////
		//
		// 	Element manipulation methods.
		//
		//////

		// Return the node to draw our children in.
		// Default is to draw them as children of this.$element.
		getChildContainer : function() {
			if (this.$childContainer) return this.$childContainer;
			if (!this.childContainerSelector) return this.$element;
			return this.getChildElement(this.childContainerSelector);
		},

		// return the child (descendant) elements of us that match a specific selector
		getChildElements : function(selector) {
			if (!this.$element || !selector) return [];
			return this.$element.select(selector);
		},

		// return the first child (descendant) elements of us that matches a specific selector
		getChildElement : function(selector) {
			return this.getChildElements(selector)[0];
		}
	}

});