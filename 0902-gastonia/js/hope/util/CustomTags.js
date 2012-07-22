
//
// custom tag parsing
//
//	To use custom tags in your output, first call
//		hope.registerTag(tagNames, constructor)		<= tagNames are "a b c" or ["a","b","c"]
//	
//	When we run across such a tag, we will instantiate the constructor with attributes of the tag
//
//	NOTE: for your tags to properly enclose normal HTML tags, 
//			they MUST be display:block or display:inline-block or some such!
//
//	? When/how do we parse for custom tags?  Manually?
//	? How do we associate a tag with a parent JS object?
var customTagExtensions = {

	// Find custom tags underneath the element (including the element itself)
	//  which have not been initialized yet.
	parseCustomTags : function(element, target) {
		if (!target) throw("parseCustomTags -- must pass a target");
		(hope.debug.parse && console.time("parseCustomTags"));
		element = $(element);
		hope.CustomTagSelectorsList.each(function(selector) {
			var tagName = hope.CustomTagSelectors[selector],
				constructor = hope.CustomTagConstructors[tagName],
				collection = hope.CustomTagCollections[tagName]
			;

			var matches = element.select(selector);
			if (!matches) return;
			

			// run through all of the matches and mark them as initialized
			// in case any of our kids want to do a parseCustomTags
			// so they won't be found next time
			matches.each(function(element) {
				element.initializeCustomTag(tagName);
			});
			
			var items = matches.collect(function(element) {
				var args = {
						$element : element,
						target : target
					};

				// if the element is of type tagName, we matched an element
				// otherwise we matched an attribute
				if (element.tagName == tagName) {
					for (var i = 0, attribute; attribute = element.attributes[i++];) {
						args[attribute.name] = attribute.value;
					}
				} else {
					Parser.fromStyleString(element.getAttribute(tagName), args);
				}
				// create the new object
				var it = new constructor(args);
				element.jsCounterpart = it;

				// assign it to the target under name if that was specified
				if (args.name) target[args.name] = it;
				
				if (collection) {
					var inOrder = target.$element.select("[initialized]");
					target[collection] = inOrder.collect(function(element){return element.jsCounterpart});
				}

				// if a collection was specified, add it

//					if (!target[collection]) target[collection] = [];
//					if (Object.isArray(target[collection])) target[collection].push(it);
//					else console.error("hope.parseCustomTags(): can't add element to ",collection," of ",target);

				// TODO: put them in document order automatically?
				
			});


		});
		(hope.debug.parse && console.timeEnd("parseCustomTags"));
		
		return element;
	},
	

	// mark a custom tag as initialized so we don't parse it again later
	// TODO: multiple types?
	initializeCustomTag : function(element, type) {
		element = $(element);
		element.setAttribute("initialized",type);
		return element;
	}


};


// add the customTagExtensions to prototype's Element which will add them to all Elements
Element.addMethods(customTagExtensions);

// add the custom tag extensions to hope with some non-elementy stuff
//
// NOTE: tags are in UPPERCASE and attributes are in lowercase, so mixing them should be ok
//
hope.extend(hope, customTagExtensions, {
	CustomTagConstructors : {},			// tagname to constructor
	CustomTagCallbacks : {},			// tagname to callback
	CustomTagCollections : {},			// tagname to collection
	CustomTagSelectors : {},			// selector to tagname
	CustomTagSelectorsList : [],			// list of selectors
	
	// Match tag names to constructors.
	//
	// 	<constructor> is used to create the thing
	//	<collection> is the name of the property on target to add to
	//	<tagName>... is the name of the tag to register under
	registerCustomTag : function(tagName, constructor, collection, callback) {
		tagName = tagName.toUpperCase();
		hope.CustomTagConstructors[tagName] = constructor;
		hope.CustomTagCollections[tagName] = collection;
		
		// select tags which have not been initialized yet
		var selector = tagName + ":not([initialized])";
		hope.CustomTagSelectorsList.push(selector);
		hope.CustomTagSelectors[selector] = tagName;

		// if in IE, create an element with that tagName name
		// so that IE recognizes this as a valid tagName
		if (Prototype.Browser.IE) {
			document.createElement(tagName);
		}
	},
	
	// match attributes to constructors
	registerCustomTagAttribute : function(attribute, constructor, collection, callback) {
		attribute = attribute.toLowerCase();
		hope.CustomTagConstructors[attribute] = constructor;
		hope.CustomTagCollections[attribute] = collection;
		
		// select tags which have not been initialized yet
		var selector = "["+attribute+"]";// + ":not([initialized])";	// TODO
		hope.CustomTagSelectorsList.push(selector);
		hope.CustomTagSelectors[selector] = attribute;
	}
	
}); // end hope.extend(hope)



// tell the class factory that we're done loading
ClassFactory.register("hope::CustomTags");
