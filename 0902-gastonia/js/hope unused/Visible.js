hope.create({
	id 				: "Visible", 
	superclass		: "Mixin",
	
	defaults		: {
		visible : true
	},
	
	methods : {
		setVisible : function(newState) {
			if (newState == undefined) newState = this.visible;
			return (newState ? this.show() : this.hide());
		},
		
		show : function() {
			this.visible = true;
			return this;
		},
		
		hide : function() {
			this.visible = false;
			return this;
		}
	}
})

