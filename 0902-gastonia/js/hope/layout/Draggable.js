hope.create({
	id 				: "Draggable",
	superclass		: "EventHandler",

	mouseDownCursor : "-moz-grabbing",
	mouseOverCursor : "-moz-grab",

	
	defaults : {
		draggable : true		// todo: conditional?  ConditionallyDraggable?
	},

	methods : {	

		// override if only part of your widget is draggable
		inDragArea : function(event) {
			return true;
		},

		// check to make sure we can be dragged to position
		// if NOT, change the position and return it
		// position is in GLOBAL coordinates
		checkDragPosition : function(position) {
			return position;
		},

		afterDraw : function($super) {
//			$super();
			this.makeDraggable();
		},
		
		// TODO: if no $element currently, defer?
		makeDraggable : function(element) {
			Draggable.makeDraggable(this, element);
		}
	},
	
	makeDraggable : function(thing, element) {
		element = element || thing.$dragElement || thing.$element;
		if (!element) return (hope.debug.events 
			&& console.warn( "Draggable.makeDraggable(",thing,"):"
							," must pass element or set $dragElement or $element"));

		thing.$dragElement = element;
		this.hookupEvents.call(thing, thing, element, this.eventHandlers);
	},
	
	// event handlers, assigned to the mixin target
	eventHandlers : {
		mousedown : function(event) {
			if (!event.isLeftClick() || !this.draggable || !this.inDragArea(event)) return;
			
			this.$dragElement.style.cursor = (this.mouseDownCursor || Draggable.mouseDownCursor);

			this.$dragElement.absolutize();
			
			// make _dragOffset relative to the pointer position
			var position = this.$dragElement.cumulativeOffset();
			this._dragOffset = {left:event.pointerX() - position.left, top:event.pointerY() - position.top};
			
			document.observe("mousemove", this.dragMove, this);
			document.observe("mouseup", this.dragStop, this);
			
			event.stop();
		},
		
		mousemove : function(event) {
			if (!this.draggable || this._dragOffset) return;
			
			this.$dragElement.style.cursor = (this.inDragArea(event) ?
				(this.mouseOverCursor || Draggable.mouseOverCursor) : "");
		},
	
		dragMove : function(event) {
			var position = this.checkDragPosition({x:event.pointerX(), y:event.pointerY()});
			if (position) {
				this.$dragElement.style.left = (position.x - this._dragOffset.left) +"px";
				this.$dragElement.style.top =  (position.y - this._dragOffset.top) +"px";
			}
		},
		
		dragStop : function(event) {
			delete this._dragOffset;
			this.mousemove(event);		// reset the cursor
			document.stopObserving("mousemove", this.dragMove);
			document.stopObserving("mouseup", this.dragStop);
		}	
	}
})