
// 
//	BoxModel -- enhances Prototype's Element with methods to deal with box models 
//		"border-box" and "content-box" as well as geting border, margin, padding sizes.
//
//	Also adds  					Element.getComputedStyle()  
//		 and fixes a bug in 	Element.getDimensions()
//	
//	Just load the file as a require and it will install the methods automatically.
//
with (hope) {
hope.create({
	id : "BoxModel",
	superclass:"Singleton",


	initialize : function(parameters) {
		// Set Prototype.BrowserFeatures.boxSizing to the name of the property
		//	to set to turn on box sizing.  If it can't be set, P.B.boxSizing will be null;
		var boxSizing = null;
		with (Prototype) {
			// set up browser version (why doesn't Prototype have this?)
			Browser.version = parseFloat(navigator.appVersion);
			// HACK: check IE
			if (Browser.IE) alert("Layout.initialize: version is "+Browser.version);
			
			// set Prototype.BrowserFeatures.boxSizing according to the browser
			if (Browser.Gecko) 								boxSizing = "MozBoxSizing";
			else if (Browser.WebKit)						boxSizing = "WebkitBoxSizing";
			else if (Browser.IE && Browser.version >= 8) 	boxSizing = "MsBoxSizing";
			
			BrowserFeatures.boxSizing = boxSizing;
		}

		var methods = BoxModel.elementMethods;
		// set up aliases for some of the methods
		methods.getMargins = methods.getMargin;
		methods.getBoxSizing = methods.getBoxModel;
		methods.setBoxSizing = methods.setBoxModel;
		methods.getBoxSizingOffset = methods.getBoxModelOffset;
		methods.getSize = methods.getDimensions;
		
		// and add them to Element
		Element.addMethods(methods);
	},

	elementMethods : {
		// Work around a bug in Prototoype 1.6.0.3 where
		//	element.getDimensions() returns a different size if the element is hidden.
		getDimensions : function(element) {
			return BoxModel.safelyGetSizes(element, BoxModel.getDimensions);
		},
		

		// return the computedStyle object according to the browser type
		// NOTE: this object is not guaranted to behave the same across all browsers
		//			so use with caution!
		getComputedStyle : function(element) {
			return (element.currentStyle || document.defaultView.getComputedStyle(element, null));
		},
		
		
		// switch an element into a different box-sizing mode
		//	(default is border-box)/
		setBoxModel : function(element, value) {
			element = $(element);

			var declaration = Prototype.BrowserFeatures.boxSizing;
			if (declaration) element.style[declaration] = (value || "border-box");
			return element;
		},
		
		// Return the box-sizing property of this element.
		// Will return "border-box" or "content-box".
		// If you have a computed style already, pass it along (faster).
		getBoxModel : function(element, computedStyle) {
			element = $(element);
			computedStyle = computedStyle || element.getComputedStyle();
			return computedStyle[Prototye.BrowserFeatures.boxSizing] || "content-box";
		},
		

		// Figure out the amount that the element's computed width and height
		//	are off from its offset width and height, due to lame W3C "content-box" box model.
		//
		//	This tells you how much border + padding an element has total.
		//	NOTE: it does NOT tell you anything about margins.
		//
		//	returns an object of 	{	width: <positive int>, height: <positive int> }
		//
		getBoxModelOffset : function(element, computedStyle) {
			element = $(element);
			computedStyle = computedStyle || element.getComputedStyle();

			// shortcut if the element is known to be border-box
			if (computedStyle[Prototype.BrowserFeatures.boxSizing] == "border-box") 
				return { width: 0, height: 0 };
				
			return BoxModel.safelyGetSizes(element, BoxModel.getBoxModelOffset, computedStyle);
		},
		

		// Set the outer size of the element irrespective of its box model and/or padding/border.
		//
		//	pass width and height as NUMBERS not pixels
		//
		setBoxSize : function(element, width, height, computedStyle) {
			if (height == undefined && width.width != null) {
				height = width.height;
				width = width.width;
			}
			element = $(element);
			var offset = element.getBoxModelOffset(computedStyle);

			if (width) element.style.width = (width - offset.width) + "px";
			if (height) element.style.height = (height - offset.height) + "px";
			return element;
		},
		
		
		// Update the dimensions of the box, irrepective of its box model and/or padding/border.
		//
		// Pass in a lastTime object and we will only apply changes
		//	  if a dimension is different than it was lastTime.
		//
		//	NOTE: This mutates lastTime to be the dimensions as set.
		//	
		updateBoxDimensions : function(element, left, top, width, height, lastTime) {
			if (!lastTime) lastTime = {};
			element = $(element);

			if (left != lastTime.left) element.style.left = left + "px";
			if (top  != lastTime.top)  element.style.top  = top + "px"; 
			
			if (width != lastTime.width || height != lastTime.height) {
				element.setBoxSize(width, height);
			}
			return element;
		},
		
		

		//
		//	border, margin, padding getters
		//

		getBorder : function(element, computedStyle) {
			element = $(element);
			return BoxModel.getDimensionMap(element, BoxModel.borderMap, computedStyle);
		},

		getMargin : function(element, computedStyle) {
			element = $(element);
			return BoxModel.getDimensionMap(element, BoxModel.marginMap, computedStyle);
		},

		getPadding : function(element, computedStyle) {
			element = $(element);
			return BoxModel.getDimensionMap(element, BoxModel.paddingMap, computedStyle);
		},
	
		
		//
		//	random helper methods for positioning
		//
		
		// is the point inside us??
		// TODO: use getBoundingClientRect ?
		pointIsInside : function(element, globalX, globalY) {
			var dimensions  = element.getDimensions(),
				offset 		= element.cumulativeOffset()
			;
			globalX -= offset.left;
			globalY -= offset.top;
			return (   globalX >= 0 && globalX <= dimensions.width 
					&& globalY >= 0 && globalY <= dimensions.height);
		}
	},
	
	//
	// callable helper methods  		(e.g.  hope.BoxModel.insetSize()
	//	TODO: add to Math?
	//

	// Inset a dimension {h,w} by one or more deltas {t,l,b,r}
	//	NOTE: mutates the original size!
	insetDimension : function(dimension, delta1, delta2, etc) {
		for (var i = 1, deltas; deltas = arguments[i++]; ) {
			dimension.width -= deltas.left + deltas.right;
			dimension.height -= deltas.top + deltas.bottom;
		}
		return dimension;
	},
	
	
	// protected defaults
	
	borderMap : {	top : "borderTopWidth", 
					right : "borderRightWidth",
					bottom : "borderBottomWidth",
					left : "borderLeftWidth"
				},

	paddingMap : {	top : "paddingTop", 
					right : "paddingRight",
					bottom : "paddingBottom",
					left : "paddingLeft"
				},

	marginMap : {	top : "marginTop", 
					right : "marginRight",
					bottom : "marginBottom",
					left : "marginLeft"
				},

	nullMap : {		top : 0,
					right : 0,
					bottom : 0,
					left : 0
				},

	// protected methods
	

	// Return a map of computed styles for an element
	//	NOTE: munges computed style directly, so may not work with all properties.
	getDimensionMap : function(element, map, computedStyle) {
		// HACK:
		// If you want to test speed without all the browser manipulation,
		//   enable the following:
		//
		//return {left:0,top:0,right:0,bottom:0};
		//
		// END HACK

		// re-use computed style if one was passed in
		if (!computedStyle) computedStyle = element.getComputedStyle();

		var object = {};
		for (var key in map) {
			object[key] = parseInt(computedStyle[map[key]]) || 0;
		}
		return object;
	},

	//  Get some dimensional property from an element even if the element is currently hidden.
	//	The <callback(element)> should return whatever you want to check.
	safelyGetSizes : function(element, callback, computedStyle) {
		element = $(element);

		// the following is lifted based on the prototype implementation
		var display = element.getStyle('display');
		if (display != 'none' && display != null) // Safari bug
		  return callback(element, computedStyle);
		
		// All *Width and *Height properties give 0 on elements with display none,
		// so enable the element temporarily
		var style = element.style,
			visibility = style.visibility,
			position = style.position,
			display = style.display
		;
		// only set properties if they're different (faster)
		if (visibility != "hidden")	style.visibility = 'hidden';
		if (position != "absolute") style.position = 'absolute';
		if (display != "block") 	style.display = 'block';
		
		// apply the callback to the element to get the results
		var results = callback(element, computedStyle);

		// only set properties back if they're different (faster)
		if (display != "block") 	style.display = display;
		if (position != "absolute") style.position = position;
		if (visibility != "hidden")	style.visibility = visibility;

		return results;
	},

	// Implementation for the Element.getBoxModelOffset routine.
	// ASSUMES:  the call is wraped in element.getDimesionEvenIfHidden()
	//				so we can assume the element is actually enabled and invisible.
	getBoxModelOffset : function(element) {
		var before = { width : element.offsetWidth, height : element.offsetHeight };
		element.style.width = before.width+"px";
		element.style.height = before.height+"px";
		var after = { width : element.offsetWidth, height : element.offsetHeight };
		var deltas = {
			width : after.width - before.width,
			height : after.height - before.height
		}
		// restore to original size
		element.style.width = (before.width - deltas.width)+"px";
		element.style.height = (before.height - deltas.height)+"px";
		return deltas;
	},
	
	// Implementation of the Element.getDimension routine.
	// ASSUMES:  the call is wraped in element.getDimesionEvenIfHidden()
	//				so we can assume the element is actually enabled and invisible.
	getDimensions : function(element) {
		return { width: element.offsetWidth, height: element.offsetHeight }
	}
	


});
}	// end with (hope)