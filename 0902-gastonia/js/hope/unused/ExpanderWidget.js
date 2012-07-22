//	TODO:
//		- cheap animation code which works in given styles ("fade", "wipe", etc)
//

//	TO FIGURE:
//		- how to init visible and enabled states automatically?
//		- multiple top-level elements?

hope.create({
	id	  				: "ExpanderWidget",
	superclass			: "Widget",
	requires			: "Expander",
	
	
	
	defaults : {
		visibleAnimationStyle	: "fade",		// "", "fade" or "wipe" etc		// TODO!

		expanders : {						// Names of expanders used in drawing this widget.
			outerHTML : undefined			// Name of template which will produce your outerHTML.
		}
	},
	
	methods : {
	
		// Return the outerHTML for the widget.
		getHTML : function() {
			return this.expandNamed("outerHTML");
		},
	
		// Redraw the outer HTML of the widget.
		drawWidget : function(parent) {
			var html = this.getHTML();
			this.$element = Element.htmlToElements(html)[0];
			parent.insert(this.$element);
		},
		
		afterDraw : function() {
			this.setVisible();
		},
		

		afterRedraw : function() {
			this.setVisible();
		},
		
		
		show : function($super) {
			var changed = (this.visible == false || this._drawing);
			if (changed) this.animate("visible", (this.visibleAnimationStyle || "") + "On");
			$super()
			return this;
		},
		
		hide : function($super) {
			var changed = (this.visible == true || this._drawing);
			if (changed) this.animate("visible", (this.visibleAnimationStyle || "") + "Off");
			$super();
			return this;
		},
		
		
		// Redraw the outer HTML of the widget.
		redrawWidget : function() {
			var html = this.getHTML();
			var oldElement = this.$element;
			this.$element = Element.htmlToElements(html)[0];
			oldElement.parentNode.replaceChild(this.$element, oldElement);
		},
		
		// Expand template <this.expanders[key]>.
		// 	<key> (string) Key for name of template in <this.expanders> map.
		//	<context> (object, optional) Context for expansion.  Default is this.
		expandNamed : function(key, context) {
			// TODDEBUG
			return Expander.expand(this.expanders[key], context || this);
		},
		
		
		
		//////
		//
		//	Animation stubs
		//
		//////
		
		
		// begin a named animation
		animate : function(name, style, params, callback, element) {
			this.stopAnimation(name);
			element = element || this.$element;
			return (this._Animations[name] = Animation.create(style, params, callback, element));
		},
		
		stopAnimation : function(name) {
			if (!this._Animations) this._Animations = {};
			if (this._Animations[name]) this._Animations[name].stop();		// "destroy"?
			delete this._Animations[name];
		}
		
	}


});