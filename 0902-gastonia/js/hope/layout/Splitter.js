

// Horizontal split layout rule.
//
// Assumes that the target[params.sizesMethod] is a function that returns a sizes array 
//	for how the layout should be right now
//	(which we run through normalizeSizes(), so you can have percentages in there).
//
hope.create( {
	id : "Splitter",
	superclass:"Spreader",
	mixins : "EventHandler",
	
	// initialize the class
	initialize : function() {
		// register custom tag
		hope.registerCustomTag("splitter", this, "layouts");
	},
	
	defaults : {
		direction : "horizontal",
		split			: 50,			// current split size (0-100)
		minSize 		: 10,			// minimum size of each piece (0-100)
		maxSize 		: 90,			// maximum size of each piece (0-100)
		splitterSize 	: 10,			// size of the split bar
		mouseOverCursor	: "-moz-grab",	// cursor to show when moving over gutter,
		mouseDownCursor	: "-moz-grabbing"
	},


//
	classDefaults : {
		numberProperties : $w("split minSize maxSize splitterSize")
	},
	
	methods : {
		initLayout : function($super) {
			$super();
			var splitter = this;
			// make sure all of our number properties are actually numbers
			hope.Splitter.numberProperties.each(function(key) {
				if (typeof splitter[key] == "number") return;
				splitter[key] = parseInt(splitter[key]);
				if (isNaN(splitter[key])) throw("Splitter.initialize: property "+key+" is not a number");
			});
			
			// NOTE: assumes that $element has been drawn already
			this.hookupEvents();
		},
		
		
		// set the split (either manually or via onResize)
		// percent can be a number (0-100) or a string ("53%" etc)
		setSplit : function(percent) {
			this.split = parseInt(percent);
			this.target.dirtyLayout();
		},
		
		// Return an array of the current sizes of the split pieces
		//	(you can express as a percentage or as numbers).
		//
		// <elementSize> is the size of the outer element {w,h}
		//
		// ASSUMES: 2 elements only!
		//
		getSizes : function(elementSize) {
			// convert to 2 digits precision
			var split = Math.floor(this.split);
			return [ split+"%", (100 - split)+"%"]
		},
		
		// actually do the resize according to the position
		onResize : function(position) {
			newSplit = Math.min(this.maxSize, Math.max(this.minSize, position.newSplit));
			if (newSplit == this.split) return;
			this.setSplit(newSplit);
		},

//
//	TODO: genericise the following into Mixin EventHandler
//
		// positionIsInPart ?
		positionIsInSplitter : function(position) {
			var min = Math.floor(position.size * position.oldSplit) - (this.splitterSize/2),
				max = min + this.splitterSize
			;
			return (position.location >= min && position.location <= max);
		},


		// getEventLocation?
		getEventPosition : function(event) {
			var x = event.pointerX(),
				y = event.pointerY()
			;
			if (!this.$element.pointIsInside(x, y)) return;

// TODO: convert to element.getBoundingClientRect()  -- FF3, IE6+, Safari?
//	NOTE: not in Safari, add it?
			var elementSize = this.$element.getDimensions(),
				offset		= this.$element.cumulativeOffset(),
				position
			;
			
			if (this.direction == "horizontal") 
					position = { size : elementSize.width,  location : x - offset.left };
			else	position = { size : elementSize.height, location : y - offset.top };

			position.oldSplit = this.split/100;
			// two digits of precision
			position.newSplit = Math.floor((position.location / position.size) * 10000)/100;

			return position;
		},
		


		// Events that we handle
		//	Note: these are hooked up to each object directly via hookupEvents (see EventHandler)
		eventHandlers : {
			// figure out if the mouse is down in the right portion of the main element
			// and set _resizing if it is
			mousedown : function(event) {
				var position = this.getEventPosition(event);
				if (!position) return;
				if (this.positionIsInSplitter(position)) {
					this._resizing = true;
					this._mouseDownPosition = position;
					this.$element.style.cursor = this.mouseDownCursor;
					event.stop();	// to stop selection
					
					// register a page-level mouseup to cancel dragging
					//	in case the mouse went up outside the page
					document.observeOnce("mouseup", function(event) {
						if (this._resizing) return this.mouseup(event);
					}, this);
				}
			},
			
			mousemove : function(event) {
				var position = this.getEventPosition(event);
				if (!position) return;
				if (this._resizing) {
					this.onResize(position);
				} else {
					var inSplitter = this.positionIsInSplitter(position);
					if (inSplitter) this.$element.style.cursor = this.mouseOverCursor;
					else			this.$element.style.cursor = "";
				}
			},
			
			mouseup : function(event) {
				delete this._resizing;
				this.$element.style.cursor = "";
			}
		}
	}

});	// end createClass("Splitter")



