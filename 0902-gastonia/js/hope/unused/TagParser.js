hope.create({
	id 			: "TagParser",
	superclass 	: "Singleton",
	
	// list of html tags we know about
	htmlTags : $w(
		  "address applet area a base basefont big blockquote body br b caption"
		+ " center cite code dd dfn dir div dl dt em font form"
		+ " h1 h2 h3 h4 h5 h head hr html img input isindex i"
		+ " i kbd link li map menu meta ol option param pre p"
		+ " samp script select small strike strong style sub sup"
		+ " table td textarea th title tr tt ul u var"
	),


	initialize : function() {
		var tagList = this.htmlTags, this.htmlTags = {};
		tagList.forEach(function(tag) {
			TagParser.htmlTags[tag] = 1;
		})
	}
});



