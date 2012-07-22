/*	TODO
		- xml parser is kinda lame
		- function parser is super lame

		- 


*/

hope.create({
	id 				: "ClassParser",
	superclass 		: "XMLParser",

	defaults : {
		parseAttributes : true
	},
	
	methods : {
	
		parse : function($super){
			(this.debug.parse && console.group("Parsing "+this.url));

			$super();
			
			// set the "root" to the first non-string member
			for (var i = 0; i < this.tree.length; i++) {
				if (typeof this.tree[i] != "string") {
					this.root = this.tree[i];
					break;
				}
			}
			if (!this.root) {
				console.warn(this,".parse(",this.url,"): no main element found");
				(this.debug.parse && console.groupEnd());
				return;
			}

			// pull out the various parts we know about
			this.attributes = [];
			this.docBlocks = [];
			this.scriptBlocks = [];
			this.functionBlocks = [];
			this.groups = [];
			this.templates = [];
			this.eventHandlers = [];
			
			this.partitionChildren(this.root);
			this.normalizeScriptBlocks();

//console.info("groups:",this.groups);
//console.info("templates:",this.templates);
//console.info("attributes:",this.attributes);
//console.info("scriptBlocks:",this.scriptBlocks);
//console.list(this.functionBlocks);

			(this.debug.parse && console.groupEnd());
		},


		// partition children into segments
		partitionChildren : function(root) {
			for (var i = 0, child; child = root.children[i++];) {
				if (typeof child == "string") continue;
				child.parent = root;
				this.partitionChild(child);
			}
		},
		
		partitionChild : function(child) {
			child.tagName = child.tagName.toLowerCase();
			switch (child.tagName) {
				case "attribute" 	: this.attributes.push(child); recurse = true; break;
				case "script"	 	: this.scriptBlocks.push(child); recurse = true; break;
				case "group"	 	: this.groups.push(child); recurse = true; break;
				case "eventhandler" : this.eventHandlers.push(child); recurse = false; break;
				case "template"		: this.templates.push(child); recurse = false; break;
				case "doc"			: this.docBlocks.push(child); recurse = false; break;
				
				default			 : (this.debug.parse && console.info("don't understand ",child));
			}
			if (recurse && child.children)  this.partitionChildren(child);
		},
		
		
		// normalize the partitioned children
		normalizeScriptBlocks : function() {
			this.scriptBlocks.map(function(script) {
				var text = script.text;

				if (!text) return;
				var functions = text.parseFunctions();
				functions.forEach(function(fn) {
					if (fn.name == "set") {
						fn.isSetter = true;
					// LAME: assume that the parent is an attribute block
						var name = script.parent.attributes.name;
						fn.name = "set"+name.charAt(0).toUpperCase() + name.substr(1);
					} else if (fn.name == "get") {
						fn.isGetter = true;
					// LAME: assume that the parent is an attribute block
						var name = script.parent.attributes.name;
						fn.name = "get"+name.charAt(0).toUpperCase() + name.substr(1);
					}
				});
				this.functionBlocks.push(functions);
			}, this);
		},
		
		
		// output routines
		outputClass : function(indent) {
			(this.debug.parse && console.time(this+".outputClass"));
			if (!indent) indent = "";
			
			var root = this.root,
				output = []
			;
			output.push("hope.create({",
							this.outputAttributes(root.attributes, indent+"\t")+",",
							this.outputDefaults(indent+"\t"),
							this.outputFunctions(indent+"\t"),
						"}); /* end hope.create("+root.attributes.id+") */"
			);
			output = indent + output.join("\n"+indent);
			(this.debug.parse && console.timeEnd(this+".outputClass"));
console.warn(output);
			return output;
		},
		

		attributeMap : {
			"class" : "className"
		},
		
		outputDefaults : function(indent) {
			var output = [];
			this.attributes.forEach(function(attribute) {
				var name = this.attributeMap[attribute.attributes.name] || attribute.attributes.name,
					value = this.normalizeValue(name, attribute.attributes.value)
				;

				output.push(name + " : " + value);
			}, this);
			
			return indent + "defaults : {\n"
				 + indent + "	"+ output.join(",\n\t"+indent) + "\n"
				 + indent + "},";
		},

		outputFunctions : function(indent) {
			var output = [];
			
			this.functionBlocks.forEach(function(block) {
				block.forEach(function(fn) {
					output.push(
						(fn.prefix ? fn.prefix.split("\n").join("\n\t"+indent)  : "") +
						fn.name + " : " + fn.body.split("\n").join("\n\t"+indent)
					);
				});
			});
			
			this.eventHandlers.forEach(function(handler) {
				var event = handler.attributes.event,
					name = "set"+event.charAt(0).toUpperCase() + event.substring(1)
				;
				output.push(name + " : " +
					"function "+name+"(handler) { this.addEventHandler('" + event + "', handler) }");
			});
			
			return indent + "methods : {\n"
				 + indent + "	"+ output.join(",\n\n\t"+indent) + "\n"
				 + indent + "}";
		}
	}	
});











