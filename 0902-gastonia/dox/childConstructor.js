		
		outputChildConstructor : function(subtree, varName, indent) {
			if (!subtree) subtree = this.tree;
			if (!subtree) return "";
			
			var children = (Object.isArray(subtree) ? subtree : subtree.children);
			if (!varName) varName = subtree['as'] || "context";
			if (!indent) indent = "";
			var output = [	"function createChildren("+varName+"){",
							"	"+varName + " = " + varName + " || this." + varName + ";",
							"\tthis.setChildren([",
							this._outputChildConstructor(children, indent+"\t\t", "", {}),
							"	]); /* end this.setChildren */",
							"\treturn this;",
							"}"
						];
			return indent + output.join("\n"+indent);
		},
		
		_outputChildConstructor : function(children, indent, name, names) {
			var output = [];
			children.forEach(function(child) {
				if (typeof child == "string") {
					output.push(indent + '"' + child.makeDoubleQuoteSafe() + '"');
				} else {
					var childOut = [], attrOut = [], attributes = child.attributes || {};
// TODO: auto-load classes we'll need?
// TODO: what to do if tag name not in the manifest ???
					var globalRef = hope.TagToIdMap[child.tagName.toLowerCase()] || child.tagName,
						childName = (attributes.name || (name ? name + "_" : "") + child.tagName)
					;
					if (names[childName]) {
						var sequence = 2;
						while (names[childName+sequence]) {
							sequence++;
						}
						childName = childName+sequence;
					}
					names[childName] = true;
					attributes.name = childName;
					
					childOut.push(indent + "new " + globalRef + "({");
					attrOut.push(indent+'\t"controller" : this');
					
					if (child.attributes) {
						for (var key in child.attributes) {
							var value = this.normalizeValue(key, child.attributes[key]);
							if (key == name) nameFound = true;
							attrOut.push(indent + "\t" + '"' + key + '" : ' + value);
						}
					}
					if (child.children) {
// TODO: if not a container, assign children to 'value'
// TODO: if attribute is ref:: it's a variable assignment
						attrOut.push(indent+'\t"children" : [\n'
										+ this._outputChildConstructor(child.children, indent+"\t\t", childName, names) + "\n"
										+ indent+'\t]'
									);
					}
					if (attrOut.length) childOut.push(attrOut.join(",\n"));
					childOut.push(indent + "}) /* end "+globalRef+" */");
					output.push(childOut.join("\n"));
				}
			}, this)
			return output.join(",\n");
		},
