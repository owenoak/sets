// TODO:  	- selectElement could take a list of attributes to set?  or just styles?

//	Pattern  GetPart
//
//	Apply to an object to create methods which access different parts of an element by selector.
//
//	ASSUMES:  <yourObject.$element> is a pointer to your outer element.
//			  If $element is not defined, fails silently and returns undefined.
//
//	NOTE: Only returns the first match for each selector.
//
//		e.g.	hope.GetPart.applyTo(yourObject, {	$outer : ".OuterElement", 
//													$inner : ".OuterElement .InnerElement 
//												  } );
//				...
//			
//				yourObject.$inner()					// <- returns pointer to the outer element
//				yourObject.$outer("foo")			// <- sets the html of inner element to "foo"
//				yourObject.$outer("foo", "after")	// <- appends "foo" to outer element
//														(you can specify "before" or "after")s
//
//	To set this up automatically on a Class:
//		1) create class property "partSelectors" as a map like the above
//		2) add "GetPart" to the .mixins for your class
//
//	
//
hope.create({
	id : "GetPart", 
	superclass:"Pattern",
	selectElement : function(methodName, selector, newHTML, position) {
		if (!this.$element) return (this.debug.elements 
							&& console.debug(this+"elements",methodName, ": $element element not defined"));
		
		var elements = this.$element.select(selector);
		if (elements.length == 0) return (this.debug.elements 
							&& console.debug(this+"elements",methodName, ": couldn't match selector '",selector,"'"));
		if (newHTML) {
			elements.each(function(element) {
				if (position == "before") {
					element.innerHTML = newHTML + element.innerHTML;
				} else if (position == "after") {
					element.innerHTML += newHTML;
				} else {
					element.innerHTML = newHTML;
				}
			});
		}
		if (elements.length == 1) return elements[0];
		return elements;
	},
	
	// it is the object to apply to
	// partSelectors  is a map of {method->selector} which returns ONLY the first element
	// partsSelectors is a map of {method->selector} which returns ALL matching elements
	applyTo : function(it, selectors) {
		// hook up the things that return a single element
		if (selectors == null) selectors = it.partSelectors;
		if (selectors == null) return (hope.warnInit
									&& hope.warnInit("GetPart.applyTo(",it,"): must specify thing.partSelectors"));
		for (var key in selectors) {
			it[key] = hope.GetPart.selectElement.curry(key, selectors[key]);
		}
	}

});