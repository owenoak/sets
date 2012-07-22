//
// Routines for parsing and managing CSS colors.
//	NOTE: to support all named browser colors, 
//			require "CSSNamedColors" manually in your subclass or page.
//
//	TODO: alpha support?
//
hope.create({
	id			: "Color",
	
	defaults : {
		id 		: undefined,
		r		: 255,
		g		: 255,
		b		: 255,
		a		: 255
	},
	
	methods : {
		// initialize the instance
		initialize : function(color) {
			// if they passed 3 or four arguments, assume they are numbers r,g,b[,a]
			if (arguments.length >= 3) {
					this.r = arguments[0];
					this.g = arguments[1];
					this.b = arguments[2];
					if (arguments.length == 4) this.a = arguments[3];
					return;
			} 
			// handle a passed color -- set our color to the same
			else if (color.isAColor) {
				this.r = color.r;
				this.g = color.g;
				this.b = color.b;
				this.a = color.a;
				return;
			}
			
			var id = color;
			// matched named colors
			// TODO: protoClone?
			if (Color.cache[id]) return Color.cache[id];
	
			// iterate through the matchers finding the first match
			for (var i = 0, found = false; i < Color.matchers.length; i++) {
				var match = Color.matchers[i].regexp.match(color);
				if (match) {
					color = Color.matchers.process(match, this);
					break;
				}
			}
			if (!found) throw "Color "+color+" not undersood";

			// save in the list of known colors
			Color.register(id, this);
		},

	
		// TODO: ignores the "a" value?
		toHex : function() {
			return  "#" + this.r.toPaddedString(2, 16)
						+ this.g.toPaddedString(2, 16)
						+ this.b.toPaddedString(2, 16);
		},

		// TODO: ignores the "a" value?
		toRGB : function() {
			return  "rgb(" + this.r + "," + this.g + "," + this.b + ")";
		},
		
		// TODO: ignores the "a" value?
		toRGBA : function() {
			return  "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
		},
	
		// return a new color that is <percent> of the way between this color and another color
		// end is another color or a color string
		// percent is a float between 0-1
		//
		// ??? is this the right algorithm?
		tween :function(end, percent) {
			if (!end.isAColor) end = new Color(end);
			
			var r = ((this.r * (1-percent)) + (end.r * percent)).round().max(0).min(255),
				g = ((this.g * (1-percent)) + (end.g * percent)).round().max(0).min(255),
				b = ((this.b * (1-percent)) + (end.b * percent)).round().max(0).min(255),
				a = ((this.a * (1-percent)) + (end.a * percent)).round().max(0).min(255)
			;
			return new Color(r,g,b,a);
		},
		
		lighten : function(percent) {},
		darken : function(percent) {}
	},

	// initialize the class
	//	stick some well-known colors in the cache
	initialize : function() {
		Color.add('black',0,0,0);
		Color.add('white',255,255,255);
		Color.add('red',255,0,0);
		Color.add('green',0,255,0);
		Color.add('blue',0,0,255);
		Color.add('yellow',255,255,0);
		Color.add('cyan',0,255,255);
		Color.add('magenta',255,0,255);
		Color.add('gray',192,192,192);
		Color.add('grey',192,192,192);
	},
	
	classDefaults : {
		manuallyRegister : true,			// We will remember only some colors,
											//  so don't have the class automatically
											//	register the colors for us.
											
		// cache of colors we already understand
		// (initialized with some values on class init)
		// see above for supporting more named browser colors
		cache : {},
		
		matchers : [
			{
				regexp : /#?([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])/,
				process : function(match, object) {
					object.r = parseInt(match[1], 16); 
					object.g = parseInt(match[2], 16); 
					object.b = parseInt(match[3], 16);
				}
			},
	
			{
				regexp : /#?([0-9a-f])([0-9a-f])([0-9a-f])/,
				process : function(match) {
					object.r = parseInt(match[1]+match[1], 16); 
					object.g = parseInt(match[2]+match[2], 16); 
					object.b = parseInt(match[3]+match[3], 16);
				}
			},
	
			{
				regexp : /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i,
				process : function(match) {
					object.r = parseInt(match[1]); 
					object.g = parseInt(match[2]); 
					object.b = parseInt(match[3]);
				}
			},
	
			{
				regexp : /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i,
				process : function(match) {
					object.r = parseInt(match[1]); 
					object.g = parseInt(match[2]); 
					object.b = parseInt(match[3]);
					object.a = parseInt(match[4]);
				}
			}
		],
	},
		
	classMethods : {
		register : function(id, color) {
			color.id = id;
			return (Color.cache[id] = color);
		},
		
		add : function(id, r, g, b) {
			Color.register(id, new Color(r,g,b));
		}
	}
});