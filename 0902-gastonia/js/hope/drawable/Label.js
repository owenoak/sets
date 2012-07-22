hope.create({
	id 				: "Label",
	superclass 		: "Drawable",
	tagName			: "Label",

	defaults : {
		className 		: "Label",
		templateId 		: "Label",
		valueSelector	: undefined			// undefined == use $element
	},
	
	methods : {
		setValue : function($super, value) {
			if (!$super(value)) return false;
			var valueElement = this.getValueElement();
			if (valueElement) valueElement.innerHTML = this.value;
		},
		
		getValueElement : function() {
			if (!this.valueSelector) return this.$element;
			return this.getChildElement(this.valueSelector);
		}
	}
});
