hope.create({
	id : "Enabler",
	superclass:"Mixin",
	defaults : {
		enabled : true
	},
	methods : {
		setEnabled : function(newState) {
			if (newState === undefined) newState = this.enabled;
			return (newState ? this.enable() : this.disable());
		},
		
		enable : function() {
			if (this.enabled) return false;
			this.enabled = true;
			return true;
		},
		
		disable : function() {
			if (!this.enabled) return false;
			this.enabled = false;
			return true;
		}
	}
})

