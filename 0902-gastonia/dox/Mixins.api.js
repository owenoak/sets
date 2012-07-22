//
//	Mixins
//

Observable		-- installed by default
Debuggable		-- installed by default
Visible			-- installed by default
Delayable		-- installed by default?
Enabled			-- installed by default?		-- cookie?
Memorable		-- use cookies to remember
					-- use other mechanism on other platforms?
Conditional		???
Composeable		-- (name? think of kids as 'parts' ?)
Collapseable	-- expands/collapses "body", stores state in cookie
Updatable		-- update semantics, called manually
AutoUpdatable	-- update semantics, called on timer
Popup			-- 
Selectable
IsParent	?

Parseable		-- parses from page
EnableIf
ShowIf

ServerOperations?

MouseHandler	? MousePartHandler ?
KeyboardHandler


- when assigning properties for a mixin, 
		if proto.method && mixin.method.arguments contains $super
		make wrapper function which calls both
	? have a special 'BREAK' return value?


- we can use a mixin as a macro by assigning a callback
		e.g. when assigning AutoUpdate, pass condition properties, etc
		 or  for name of 'children' array 
	use class creation form:
		C$.createClass("Foo", {
			..., supers : { 	
					"Class" : {classProps}, 
					"Mixin" : {mixinProps} || Function
				}, ...
		})
	- call it "Macro" instead ?

- Observable
	.Callbacks								// ListMap of "event callbacks" : [ method, method, method ]
	.Events = ["event","event","event"]		// list of events we handle (for introspection)
											//   Auto-muxed with list from supers and Mixins
	
	.observe("event", callback)
	.ignore("event", callback)				// if callback undefined, forgets all
	.notify("event", arg1, arg2, etc)		// methods are always called with widget as this (?)
	
	// event does NOT include "on"
	// events normalized to lower case (?)
	

- Debuggable
	.Flags = {}								// somehow merged with supers?
	.debug(flag, msg, msg, msg)				// if flag, only actually shows if flag is true
	.warn(flag, msg, msg, msg)
	.error(flag, msg, msg, msg)
	.info(flag, msg, msg, msg)
	// how to distinguish 
	
	this.$debug(this.debugOperations, "blah")
	// BETTER
	this.$debug("opereation", "blah", "blah")
	// BEST
	this.debugOperation("blah")		// set up in mixin creator?  spammy... ??
	
	
- Conditional
	.Conditions(key)				// map of 'conditionalName' : {prop:value, prop:value}
									// or  						: ConditionFunction
	.checkCondition(key)			// returns true if condition conditionName is true
	.setCondition(prop, value)		// sets this[prop]value
									// widget.notify(conditionName, value) if true ?
	

- Visible
	.show(bool)		==>  notify("show")
	.hide()			==>	 notify("hide")
	// pass condition to mixin for visibleIf?

- VisibleIf
	.visibleCondition = {propName:value}	(propNames are propNames on object)
	.setCondition()

- Enabled
	.enabled = true
	.disabledClassName = String
	.enable(bool)	==> notify("enable")
	.disable()		==> notify("disable")
	//	calls enable() or disable() on initialize
	//	(cookie?) -- do as show/hide?  pass 'remember' to cookie?
	//	<enable|disable>Children()

- EnableIf
	.enabledCondition = {propName:value}	
	.setCondition()

- Delayable
	.Delays = {}
	.delay(fn, interval, timerName)
	.clearDelay(timerName)


- Collapseable
	. expanded = true
	. animationInterval = .25
	. collapseClassName = "string"
	. collapsingSelector = Selector
	. getCollapsingElement()
	. toggle()				
	. expand(bool)			==> notify("expand")
	. collapse(bool)		==> notify("collapse")


- Eventful
	.Events : []		// default is to handle all mouse events, can sub-set by specifying Events?
	.hookupEvents
	.eventSelector


- Composeable			// assumes Eventful
	.getPart(partId)
	.eventDispatcher	notify("mouseover", "mouseout", "mouseenter", etc)
	.getPartForEvent
	// made up mouseEnter and mouseLeave semantics
	// right-click
	// parts vs children?
	// different sets of parts?


- Updatable
	.updateURL 				// interpolated on this
	.update					==> notify("update")
	// redraw on update?
	// updateAndHilightChildren thinger?

- AutoUpdatable				// assumes Conditional, Updatable
	.updateInterval
	.updateCondition
