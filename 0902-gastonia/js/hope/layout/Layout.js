
/*

TODO:  
	- Layoutable ?
	- pick up padding, border, margin from inline style for speed (?)
		- default to "0", set to "auto" inline to have it actually pick up?
	- dox
	- debugging
	- "compass" layout?


*/
with (hope) {
hope.create({
	id : "Layout", 
	superclass:"Mixin",
	mixins : "Debuggable",
	requires : "BoxModel CustomTags",

	defaults : {
		layoutDelay : 20			// delay after a call to dirtyLayout() before layout is recalc'd
									// set to a bigger number for layouts that take a lot of time
									// which will be refreshed frequently (eg with a Splitter or Resizer)
	},

	methods : {

		// Compute the current layout.
		//
		//	Initializes the layout rules automatically if they have not already been set up.
		//
		//	If the structure of your main element changes, 
		//		call	this.dirtyLayout(true)	to set up the layout rules again.
		//
		layout : function() {
			console.time("layout");
			if (this.beforeLayout) this.beforeLayout();
			
// NOTE: assumes that layouts have already been initialized!

			if (this.layouts) {
				this.layouts.invoke("layout");
			}
			
			if (this.afterLayout) this.afterLayout();
			console.timeEnd("layout");
		},
		
		// Re-compute the layout again in a little bit.
		//	Use this rather than calling layout() directly to avoid churn if you're doing
		//	a bunch of things which might each effect the layout.
		//
		//	If the structure of your layout'ed elements changes, 
		//	pass true to   reinitialize		to set up the layout rules again.
		//
		dirtyLayout : function(reinitialize) {
			if (reinitialize) delete this._layoutRules;
			if (this._layoutTimer) return;
			this._layoutTimer = setTimeout(function(){
					delete this._layoutTimer;
					this.layout();
				}.bind(this), this.layoutDelay);
		}
	}	// end applied methods
	
});	// end createMixin Layout
}//	end with (hope)

