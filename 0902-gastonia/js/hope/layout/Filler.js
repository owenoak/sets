

// Completely fill our parent, respecting padding and margins.
//	ASSUMES: That this is the only element inside its parent.
//			 If that is not the case, use a VerticalLayoutRule instead
//
// Useful for a scrolling container inside something else.
//
hope.create( {
	id : "Filler",
	superclass:"BaseClass",
	requires : "CustomTags",

	// initialize the class
	initialize : function() {
		hope.registerCustomTagAttribute("filler", this, "layouts");
	},	

	methods : {
		initialize : function(parameters) {
			if (parameters) hope.extend(this, parameters);

			this.parent = $(this.$element.parentNode);
			this.parentPadding = this.parent.getPadding();
			this.margins = this.$element.getMargins();
		},
		
		layout : function() {
			// first get the outer size
			var size = this.parent.getDimensions();
			
			// inset by the parent padding and by our margins
			size = hope.BoxModel.insetDimension(size, this.parentPadding, this.margins);

			// that's how big we should be!
			this.$element.setBoxSize(size.width, size.height);	
		}
	}
});	// end createClass("FillLayoutRule")


