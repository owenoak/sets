/*
	- mixin or rule (ala layout) -- manipulators?
		- if rule (object):
			- can have more than one per outer object
			- less api spread on target
			- don't have to declare ahead of time -- can just pick up from template
			- don't have to worry about crossed properties w/other manipulators
		- if mixin
			- simpler to modify move on the target
		? both?
	? how to figure out which manipulator gets precedence?
		- dragger, resizer, splitter
		- document order?
	- legal edge check
	- min/max sizes
	- fasttrack move
		- resizeN, resizeS, resizeE, resizeW routines, set up on mousedown
	- how to save coordinates?

*/

hope.create({
	id 				: "Resizable",
	superclass		: "EventHandler",
	requires		: "CustomTags",

	mouseDownCursor : "-moz-grabbing",
	mouseOverCursor : "-moz-grab",

	defaults : {
		resizable : true,		// todo: conditional?  ConditionallyDraggable?
		dragEdges : "all",
		edgeSize  : 10
	},

	methods : {	
		getDragEdge : function(event) {
			var offset = this.$resizeElement.cumulativeOffset(),
				size = this.$resizeElement.getDimensions(),
				right = offset.left + size.width,
				bottom = offset.top + size.height,
				x = event.pointerX(),
				y = event.pointerY(),
				edge = ""
			;
			if 		(offset.top < y && y < offset.top+10) 	edge += "n";
			else if (bottom - 10 < y && y < bottom) 		edge += "s";

			if 		(offset.left < x && x < offset.left+10) edge += "w";
			else if (right - 10 < x && x < right) 			edge += "e";
			
			return edge || null;
		},
		
		getDragCursor : function(edge) {
			return (edge ? edge+"-resize" : "");
		},
		
		// check to make sure we can be dragged to position
		// if NOT, change the position and return it
		// position is in GLOBAL coordinates
		checkDragPosition : function(position) {
			return position;
		},

		afterDraw : function($super) {
			$super();
			this.makeResizable();
		},
		
		// TODO: if no $element currently, defer?
		makeResizable : function(element) {
			Resizable.makeResizable(this, element);
		}
	},
	
	makeResizable : function(thing, element) {
		element = element || thing.$resizeElement || thing.$element;
		if (!element) return (hope.debug.events 
			&& console.warn( "Resizable.makeDraggable(",thing,"):"
							," must pass element or set $resizeElement or $element"));

		thing.$resizeElement = element;
		EventHandler.methods.hookupEvents.call(thing, thing, element, this.eventHandlers);
	},
	
	// event handlers, assigned to the mixin target
	eventHandlers : {
	
		mousedown : function(event) {
			if (!event.isLeftClick() || !this.resizable) return;

			var edge = this.getDragEdge(event);
			if (!edge) return;
			
		//	this.$resizeElement.style.cursor = (this.mouseDownCursor || Resizable.mouseDownCursor);

			this._dragEdge = edge;

			this.$resizeElement.absolutize();
			
			// make _resizeOffset relative to the pointer position
			var position = this.$resizeElement.cumulativeOffset();
			this._resizeOffset = {left:event.pointerX() - position.left, top:event.pointerY() - position.top};
			
			document.observe("mousemove", this.resizeMove, this);
			document.observe("mouseup", this.resizeStop, this);
			
			event.stop();
		},
		
		mousemove : function(event) {
			if (!this.resizable || this._resizeOffset) return;
			
			var cursor = this.getDragCursor(this.getDragEdge(event));
			this.$resizeElement.style.cursor = cursor;
		},
	
		resizeMove : function(event) {
//			var position = this.checkDragPosition({x:event.pointerX(), y:event.pointerY()});

			var edge = this._dragEdge,
				element = this.$resizeElement,
				x = event.pointerX(),
				y = event.pointerY(),
				offset = this._resizeOffset
			;
			
			if 		(edge.indexOf("n") > -1) element.style.top = y - offset.top + "px";
			else if (edge.indexOf("s") > -1) element.style.height = y - offset.top + "px";

			if 		(edge.indexOf("w") > -1) element.style.left = x - offset.left + "px";
			else if (edge.indexOf("e") > -1) element.style.width = x - offset.left + "px";

			if (this.layout) this.layout();
		},
		
		resizeStop : function(event) {
			delete this._resizeOffset;
			this.mousemove(event);		// reset the cursor
			document.stopObserving("mousemove", this.dragMove);
			document.stopObserving("mouseup", this.resizableStop);
		}	
	}
})