hope.create({
	id : "Collapser",
	superclass:"Mixin",
	defaults : {
		expanded : true
	},
	methods : {
		expand : function(newState) {
			if (newState === undefined) newState = true;
			if (!newState) return this.collapse();
			this.expanded = true;
			return this;
		},
		
		collapse : function() {
			this.expanded = false;
		},
		
		toggle : function() {
			this.expand(!this.expanded);
		}
	}
})

