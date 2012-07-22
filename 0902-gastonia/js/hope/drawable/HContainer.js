// TODO:   
//		- teach drawable about box model, have  "setSize" which takes model into account
// 		- 



//
// abstract class to spread a number of children across a particular direction
//	according to a sizes array
hope.create( {
	id : "HContainer",
	superclass : "Container",
	requires : "BoxModel",
	tagName : "HContainer",

	// Our layout algorithms are symmetrical along the vertical and horizontal axes.
	// The following sets of keys are used in such algorithms instead of explicitly saying
	//	"top" or "left".  These are hooked up in class.initialize().
	classDefaults : {
		keys : {
			v : { before : "top",  after : "bottom", size : "height", getter: "getHeight" },
			h : { before : "left", after : "right",  size : "width",  getter: "getWidth" }
		}
	},	// end class defaults


	defaults : {
		templateId : "HContainer",
		direction : "horizontal"
	},
	

	methods : {
		initialize : function(parameters) {
			this.extend(parameters);
			this.setDirection();
		},
		
		setDirection : function(direction) {
			if (direction) {
				this.direction = (direction.charAt(0).toLowerCase() == "v" ? "vertical" : "horizontal");
			}
			this.mainKeys = hope.HContainer.keys[ this.direction == "horizontal" ? "h" : "v" ];
			this.altKeys  = hope.HContainer.keys[ this.direction == "horizontal" ? "v" : "h" ];
		},



		//////
		//
		// 	drawing
		//
		//////
		
		prepareToDraw : function($super) {
			$super();
		},
		
		
		afterDraw : function($super) {
			$super();
			this.$element.setBoxModel("border-box");
			this.layout(true);
		},


		//////
		//
		// 	children
		//
		//		TODO: could be smarter about not having to init the entire layout again...
		//
		//////
		addChild : function($super, child) {
			$super(child);
			if (this.$element) {
				this.layout(true);
			}
		},
		
		removeChild : function($super, child) {
			$super(child);
			if (this.$element) {
				this.layout(true);
			}
		},


		drawChild : function($super, child) {
			$super(child);
			// set child to border-box model to make positioning faster
			if (child.$element) {
				child.$element.setBoxModel("border-box");
				child._width = child.$element.getStyle("width");
				child._height = child.$element.getStyle("height");
console.info(child, child._width, child._height);
			}
		},


		//////
		//
		// 	layout mechanics
		//
		//////

		initLayout : function() {
			// find and set up the children to be laid out
			this.childMargins = this.children.map(function(child) {
				if (child.$element) return child.$element.getMargins();
				return BoxModel.nullMap;
			});
			
			this.sizes = this.normalizeSizes(this.sizes, this.children);
			this.adjustMargins(this.mainKeys.before, this.mainKeys.after);
			this.padding = this.$element.getPadding();
		},
		
		layout : function(reinitialize) {
			if (!this.children) return;
			
			if (reinitialize) this.initLayout();
			
			// fill the spreader to the full size of its parent
	///XXX  MAYBE NOT...
			var parent = this.getParentElement(),
				parentSize = parent.getDimensions(),
				elementSize = this.$element.getDimensions()
			;

			// if element is 0 size, set to size of parent
			if (elementSize.width == 0) {
				elementSize = hope.BoxModel.insetDimension(parentSize, this.padding);
				this.$element.setBoxSize(elementSize);
			} else {
				hope.BoxModel.insetDimension(elementSize, this.padding);
			}
			
			// figure out the actual sizes (heights and tops)
			//	this takes padding of outer element and margins of inner elements into account
			var sizes = this.getSizes(),
				newSizes = this.getActualSizes(sizes, elementSize, this.mainKeys, this.altKeys),
				lastDimensions = this.lastDimensions,
				maxWidth = 0,
				maxHeight = 0
			;
			this.children.forEach(function(child, index) {
				if (!child.$element) return;
				var newSize = newSizes[index];
				if (newSize.width  > maxWidth)  maxWidth = newSize.width;
				if (newSize.height > maxHeight) maxHeight = newSize.height;
				child.$element.updateBoxDimensions(
						newSize.left,
						newSize.top,
						newSize.width,
						newSize.height,
						lastDimensions[index]
					)
				;
				lastDimensions[index] = newSize;
			});
console.info(maxWidth, maxHeight);
			if (this.direction == "horizontal") {
				this.setHeight(maxHeight);
			} else {
				this.setWidth(maxWidth);
			}
		},

		// sizes are static in most layouts
		// NOTE: sizes will be normalized in our initialize() routine if they are set
		getSizes : function(elementSize) {
			return this.sizes;
		},

		// given a list of sizes, normalize them to either
		//		null  	== get size from element on screen
		//		number	== fixed number
		//		"xx%"	== percentage of total
		//
		//	Takes the same values as input 
		//	Note: if no sizes are de
		normalizeSizes : function(sizes, children) {
			var	starCount = 0;
	
			if (!sizes) 						sizes = [];
			else if (typeof sizes == "string")	sizes = sizes.split(",");
			else 								sizes = sizes.clone();
			
			// normalize each size
			children.forEach(function(child, index) {
				var size = (child._size || sizes[index] || "*").toLowerCase(),
					isPercent = size.indexOf("%") > -1
				;
				
				if      (size == null)		;					// leave as null (indicates take from element)
				else if (isPercent)	 		;					// leave as a string
				else if (size == "auto") 	size = null;		// null indicates get from the element
				else if (size == "*") 		starCount++;
				else if (parseInt(size))	size = parseInt(size);
				else throw("Layout._normalizeSizes(): don't understand size "+size);
	
				sizes[index] = size;
			});
			
			// if there are any stars, figure out equal percentage for each and convert
			if (starCount) {
				var starPercent = Math.round(100 * 100 / starCount) / 100 + "%";
				sizes.forEach(function(size, index) {
					if (size == "*") sizes[index] = starPercent;
				})
			}
			return sizes;
		},
		
		//
		// Figure out the "vertical" margins as the greater of the 
		//	("bottom" margin of "top" element) and ("top" margin of "bottom" element)
		//
		//  This will be called as:
		//		   rule.adjustMargins("top",  "bottom")
		//	  or   rule.adjustMargins("left", "right")
		//
		adjustMargins : function(topKey, bottomKey) {
			var margins = this.childMargins,
				last = this.children.length - 1,
				lastDims = this.lastDimensions = []
			;
			this.adjustedMargins = this.children.collect(function(child, index) {
				lastDims[index] = {};
				if (index == 0) 	return margins[0][topKey];
				return Math.max(margins[index][bottomKey], margins[index-1][topKey]);
			});
			this.adjustedMargins.push(margins[last][bottomKey]);
		},

		
		// Get actual sizes to use for layout along some dimension, either horizontal or vertical.
		//  The method is symmetrical for H or V layouts.
		getActualSizes : function(sizes, elementSize, main, alt) {
			// reduce remaining total by margins of parent
			var children    = this.children,
				margins 	= this.adjustedMargins,		// adjusted to be the margins between elements
				
				// take the initial margin out of the remaining size
				remaining 	= elementSize[main.size] - margins[0],
				total  		= 0
			;
			// figure out fixed "heights"
			var rule = this,
				actualSizes = children.collect(function(child, index) {
					var actualSize = {};
					actualSize[alt.before] = rule.padding[alt.before];
					actualSize[alt.size]   = elementSize[alt.size] 
											  - rule.childMargins[index][alt.before]
										 	  - rule.childMargins[index][alt.after];
					var size = sizes[index];
		
					// don't worry about percentages, we'll get those in the next round
					if (typeof size != "string") {
						// if null, get the "size" via the accessor
						if (size == null) {
							// set the dimension to auto so we get an accurate reading of the current "size"
							child.$element.style[main.size] = "auto";
							
							// and set the opposite dimension to the elementSize
							//	so we get an accurate read on it's new size
							child.$element.style[alt.size] = actualSize[alt.size]+"px";
			
							// and use the getter to get the current size
							size = child[main.getter]();
						} // otherwise must already be a number
			
						// remember the "height" and decrease the remaining space
						actualSize[main.size] = size;
						remaining -= size;
					}
					// take the adjusted margin out of the remaining as well
					remaining -= margins[index];
					return actualSize;
				}
			);
			
			// figure out percentages as proportion of remaining
			children.forEach(function(child, index) {
				var actualSize = actualSizes[index];
				var size = sizes[index];
				if (typeof size == "string") {
					actualSize[main.size] = ((parseInt(size) / 100) * remaining);
				}
				
				// now remember the "top" and increase it for the next time (including the margin)
				actualSize[main.before] = total;
				total += actualSize[main.size] + margins[index];
			});
			return actualSizes;
		}

	} // end methods

	

});	// end createClass("HContainer")


