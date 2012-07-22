// TODO:   
//		- teach drawable about box model, have  "setSize" which takes model into account
// 		- 



//
// abstract class to spread a number of children across a particular direction
//	according to a sizes array
hope.create( {
	id : "HTable",
	superclass : "Container",
	requires : "BoxModel",
	tagName : "HTable",

	defaults : {
		className	: "HTable",
		templateId 	: "HTable"
	},
	
	methods : {
	
		afterDraw : function() {
			this.$row = this.getChildElement("TR");
			if (this.children) this.drawChildren();
			if (!this.enabled) this.setEnabled();
		},


		drawChild : function($super, child, index) {
			// make sure we have a cell at the correct index
			while (this.$row.cells.length <= index) {
				this.$row.appendChild(new Element("td"));
			}
			var cell = this.$row.cells[index];
			// just put the child in for now
			if (typeof child == "string") 	cell.appendChild(document.createTextNode(child));
			else if (child.$element)		cell.appendChild(child.$element);
			else							child.draw(cell);

			// set the width of the cell to the expressed width of the child
			cell.style.width = child._width = child.$element.getStyle("width");
		}
	}

});