hope.create({
	id : "AnimationStyle",
	superclass : "Factory",

	requires : "CSSAnimation",
	
	// parse an animationStyle string and return an animation to execute it
	parse : function(string, element, callback, autoStart) {
//console.time("parsing '"+string+"'");

		var cached = AnimationStyle.cache[string];
		// if we've never seen this exact style before, parse
		if (!cached) {
			// try as a two-word id first
			var split = $w(string.toLowerCase()),
				next = 2,
				id = split[0]+" "+split[1],
				style = AnimationStyle.Registry[id]
			;
			// if that didn't work, try as a one-word id
			if (!style) {
				id = split[0];
				next = 1;
				style = AnimationStyle.Registry[id];
			}
			if (!style) throw "Don't understand animation style '"+string+"'.";
			
			// if initialization was deferred, do it now
			if (!style.animationConstructor) this.initStyle(style);
			
			var animationConstructor = style.animationConstructor,
				styles = {},
				params = {},
				styleFound = false,
				paramsFound = false
			;
	
			if (style.parsers) {
				style.parsers.forEach(function(parser){
					var value = split[next];
					if (value) {
						var match = value.match(parser.parser);
						value = (match ? match[0] : null);
					}
					if (!value && !parser.optional) 
						throw "Can't parse animation style '"+string+"': expected " + style.hint;

					if (value) {
						next++;

						if (value == "current" || value == "*") return;
						// if a numeric property and the value doesn't specify units, add "px"
						if (CSSAnimation.numericProperties[parser.key]) {
							if (""+parseInt(value) == value) value += "px";
						}
						if (parser.isStyleProp) {
							styles[parser.key] = value;
							styleFound = true;
						}
						else {
							params[parser.key] = value;
							paramsFound = true;
						}
					}
				});
			}
//console.warn(styles);
			if (!styleFound) styles = undefined;
			if (!paramsFound) params = undefined;
			
			// remember in the cache so we can do it again quickly later
			cached  = AnimationStyle.cache[string] 
					= { animationConstructor: animationConstructor, styles: styles, params: params };
		}

		var animation = new cached.animationConstructor(element, cached.styles, cached.params, 
												callback, (element ? autoStart : false));

//console.timeEnd("parsing '"+string+"'");
		return animation;
	},
	
	// cache of animation style instances we've seen before
	cache : {},
		
	// special parsers for some params
	paramParsers : {
		duration		: /^(\d*\.?\d+s|very fast|fast|normal|slow|very slow|immediate)$/,
		timingFunction 	: /^ease|linear|ease-in|ease-out|ease-in-out$/,
		opacity			: /^\d*\.?\d+$/,

		number 			: /^(-?\d*\.?\d+(%|em|px)?|current|\*|left|top|width|height|right|bottom|max|center)$/,
		left			: "number",
		right			: "number",
		top				: "number",
		bottom			: "number",
		width			: "number",
		height			: "number",

		color			: /^(rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|#[0-9a-f]{6}|#[0-9a-f]{3}|\w+)$/,
		backgroundImage	: "color"
	},
	
	// animation style parametrs which are not set directly as styles
	nonStyleProperties : {
		duration:1, timingFunction:1
	},
	
	
	// register an animation style
	Registry : {},
	_parseStringParser : /^<([^'"]*)>\s*(.*)$/,
	register : function(parseString, defaults, superclass) {
		var match = parseString.match(AnimationStyle._parseStringParser);
		if (!match) throw "Don't understand animation style: "+parseString;
		
		var ids = match[1].split("|");
		
		var style = {
			id : ids[0].charAt(0).toUpperCase() + ids[0].substr(1) + "Animation",
			superclass : superclass || "CSSAnimation",
			defaults : defaults,
			parsers : match[2],
			styles : (defaults ? defaults.styles : null),
			hint : parseString.toLowerCase()
		}

		this.initStyle(style);
		
		ids.forEach(function(id) {
			id = id.toLowerCase();
			AnimationStyle.Registry[id] = style;
		});
		return style.animationConstructor;
	},
	
	initStyle : function(style) {
		// create the custom constuctor
		style.animationConstructor = hope.create({
											id:style.id, 
											superclass:style.superclass, 
											defaults:style.defaults
										});

		// interpolate the style parsers
		if (style.parsers) {
			style.parsers = style.parsers.split(" ");
			style.parsers.forEach(function(key, index) {
				var optional = (key.charAt(key.length-1) == "?");
				if (optional) key = key.substr(0,key.length-1);
				var parser = AnimationStyle.paramParsers[key];
				if (typeof parser == "string") parser = AnimationStyle.paramParsers[parser];
				style.parsers[index] = {
								key:key, 
								parser:parser, 
								optional:optional, 
								isStyleProp: !AnimationStyle.nonStyleProperties[key]
							};
			});
		}	
	},
	
	
	// initialize the class -- create a bunch of animation styles
	initialize : function() {
	try {
//console.time("initialize AnimationStyles");	
		// add an "animate" function to all Elements which you can pass an animation style
		Element.addMethods({
			animate : function(element, animationStyle, callback) {
				element = $(element);
				if (element.animation) element.animation.stop();
				element.animation = AnimationStyle.parse(animationStyle, element, callback);
				return element.animation;
			}
		});
		
		// add an "animate" method to CSSAnimations which adds another named animation on its chain
		CSSAnimation.prototype.animate = function(animationStyle, callback) {
			// add as nextInChain
			return this.setNextInChain(AnimationStyle.parse(animationStyle, this.element, callback, false));
		}
	
	
		//
		// register a bunch of animations
		//
		
		
		// simple show/hide with no effect
		this.register(	"<Show>", 
						{styles: {display:''}, duration:0}
					 );
		this.register(	"<Hide>", 
						{styles: {display:'none'}, duration:0}
					 );
 
 		// fade animations
		this.register(	
						"<FadeIn|fade-in|fade in> duration? timingFunction?",
						{styles: {opacity:1}, onStart:function(){this.element.style.display = ''}}
					 );
		this.register(	
						"<FadeOut|fade-out|fade out> duration? timingFunction?",
						{styles : {opacity:0}, onStop:function(){this.element.style.display = 'none'}}
					 );
		this.register(	
						"<FadeTo|fade-to|fade to> opacity duration? timingFunction?",
						{styles : {opacity:.5}}
					 );


 		// dimension changing animations
		this.register("<Move|moveto|move to|move-to> left top? width? height? duration? timingFunction?");
		this.register("<Resize|resizeto|resize to|resize-to> width height? duration? timingFunction?");
		this.register("<Center> duration? timingFunction?", 
						{styles:{left:"center",top:"center"}}
					);
		this.register("<Maximize> duration? timingFunction?", 
						{styles:{left:0,top:0,width:"max",height:"max"}}
					);

// NOTE: more animation styles in AnimationStyleExtras

//console.timeEnd("initialize AnimationStyles");
} catch (e) {
	console.error(e.message);
}
	}

});
