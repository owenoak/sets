hope.include("AnimationStyle", 
	function() {
		// NOTE: this is only well defined if opposing pairs are not specified
		var grower = this.register("<Grow> top right? bottom? left? duration? timingFunction?",
						{ onStart : function() {
								var startWidth = this.element.getWidth(),
									startHeight = this.element.getHeight()
								;
//console.info(this.endStyles, "\n", this.startStyles);
								if (this.endStyles.top) {
									this.endStyles.height = parseInt(this.startStyles.top) 
														  - parseInt(this.endStyles.top) 
														  + startHeight + "px";
								}
								else if (this.endStyles.bottom) {
									this.endStyles.height = parseInt(this.endStyles.bottom) 
													  	  - parseInt(this.startStyles.bottom) 
													  	  + startHeight + "px";
								
								}

								if (this.endStyles.left) {
									this.endStyles.width = parseInt(this.startStyles.left) 
														  - parseInt(this.endStyles.left) 
														  + startWidth + "px";
								}
								else if (this.endStyles.right) {
									this.endStyles.width  = parseInt(this.endStyles.right) 
													  	  - parseInt(this.startStyles.right) 
													  	  + startWidth + "px";
								
								}
							}
						}
					);
		


		// grow variants (necessary ?)
		this.register("<GrowTop|grow top> top duration? timingFunction?", null, grower.id);
		this.register("<GrowBottom|grow bottom> bottom duration? timingFunction?", null, grower.id);
		this.register("<GrowLeft|grow left> left duration? timingFunction?", null, grower.id);
		this.register("<GrowRight|grow right> right duration? timingFunction?", null, grower.id);
		
		
		// shrinkers
		this.register("<ShrinkUp|shrink up> duration? timingFunction?", {styles:{height:0}}, grower.id);
		this.register("<ShrinkLeft|shrink left> duration? timingFunction?", {styles:{width:0}}, grower.id);
		this.register("<ShrinkDown|shrink down> duration? timingFunction?", 
						{
							styles:{height:0, bottom:"*"},
							onStart : function() {
								delete this.endStyles.bottom;
								this.endStyles.top = this.startStyles.bottom;
							}
						}
					);
		this.register("<ShrinkRight|shrink right> duration? timingFunction?", 
						{
							styles:{width:0, right:"*"},
							onStart : function() {
								this.endStyles.left = this.startStyles.right;
							}
						}
					);

	// Manually let the class factory know that we've finished loading
	ClassFactory.register("hope::AnimationStyleExtras");
});