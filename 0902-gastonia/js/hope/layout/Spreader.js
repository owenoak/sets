

//
// abstract class to spread a number of children across a particular direction
//	according to a sizes array
hope.create( {
	id : "Spreader",
	superclass : "BaseClass",
	requires : "CustomTags Layout",

	// initialize the class
	initialize : function() {
		// register the Spreader tag name
		hope.registerCustomTag("spreader", this, "layouts");
		hope.registerCustomTagAttribute("spreader", this, "layouts");
	},


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
		direction : "horizontal"
	},
	

	methods : {
		initialize : function(parameters) {
			if (parameters) hope.extend(this, parameters);
			this.direction = (this.direction.charAt(0).toLowerCase() == "v" ? "vertical" : "horizontal");
			
		},
		
		initLayout : function() {
			this._initialized = true;
			this.mainKeys = hope.Spreader.keys[ this.direction == "horizontal" ? "h" : "v" ];
			this.altKeys  = hope.Spreader.keys[ this.direction == "horizontal" ? "v" : "h" ];

			// find and set up the children to be laid out
			this.initializeChildren();
			this.sizes = this.normalizeSizes(this.sizes, this.$children);
			this.adjustMargins(this.mainKeys.before, this.mainKeys.after);
			this.padding = this.$element.getPadding();
		},
		
		layout : function() {
			if (!this._initialized) this.initLayout();
			
			// fill the spreader to the full size of its parent
			var parent = $(this.$element.parentNode),
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
				lastDimensions = this.lastDimensions
			;
			this.$children.each(function(child, index) {
				var newSize = newSizes[index];
				child.updateBoxDimensions(
						newSize.left,
						newSize.top,
						newSize.width,
						newSize.height,
						lastDimensions[index]
					)
				;
				lastDimensions[index] = newSize;
			});
		},

		// sizes are static in most layouts
		// NOTE: sizes will be normalized in our initialize() routine if they are set
		getSizes : function(elementSize) {
			return this.sizes;
		},

		// initialize the children of the outer element
		initializeChildren : function() {
			var children = this.$children = this.$element.childElements();
			if (children.length == 0) return console.warn("no children of ",this.$element.className);
	
			// convert to absolute positioning and border-box box model
			this.$element.style.position = "absolute";
			this.$element.setBoxModel("border-box");
	
			// convert children to border-box and absolute positioning as well
			this.childMargins = children.collect(function(child, index) {
				child.setBoxModel("border-box");
				child.style.position = "absolute";	// set to absolute position always (?)
				return child.getMargins();
			});		
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
			children.each(function(child, index) {
				var size = (sizes[index] || "*").toLowerCase(),
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
				sizes.each(function(size, index) {
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
				last = this.$children.length - 1,
				lastDims = this.lastDimensions = []
			;
			this.adjustedMargins = this.$children.collect(function(child, index) {
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
			var children    = this.$children,
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
							child.style[main.size] = "auto";
							
							// and set the opposite dimension to the elementSize
							//	so we get an accurate read on it's new size
							child.style[alt.size] = actualSize[alt.size]+"px";
			
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
			children.each(function(child, index) {
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

	

});	// end createClass("Spreader")


