/******
 **
 **		Docutron - live documentor for the hope system
 **
 **		Dependencies:	(legion)
 **
 **		Note: Docutron is deliberately designed to work WITHOUT widgets
 **				so it is likely to work no matter what is currently installed.
 **
 ******/


hope.create({
	id : "Docutron",
	superclass:"Singleton",
	mixins : "GetPart Layout Resizable",
	requires : "Spreader Splitter Filler",
	expanders : "Docutron",
	styles : "Docutron",
	
	left : 20,
	top: 20,
	
	width : 600,
	minWidth : 400,
	
	height: 400,
	minHeight : 200,
	
	selectedThing : hope,
	details : {
		Hope : "Classes",
		Class : "Inheritance",
		Singleton : "Inheritance",
		Mixin : "Inheritance",
		Pattern : "Inheritance",
		Factory : "Inheritance"
	},

	// the GetPart pattern will give us methods that access the following selectors
	partSelectors : {
		$hsplit			: ".Splitter",
		$thing 			: ".Thing",
		$thingTitle		: ".Thing .Title",
		$thingContentsContainer	: ".Thing .ContentsContainer",
		$thingMenu		: ".Thing .ThingMenu",
		$thingContents	: ".Thing .Contents",
		$detail			: ".Detail",
		$detailTitle	: ".Detail .Title",
		$detailContentsContainer	: ".Detail .ContentsContainer",
		$detailContents	: ".Detail .Contents",
		$history		: ".History",
		$historyList	: ".History .ThingList"
	},


	initialize : function() {
		// HACK:
		window.dox = hope.Docutron;
		
		// don't reinitialize -- drawThing() instead
		if (this._drawn) return this.drawThing();
		
		// get pereferences stored in a cookie and apply them to us
		hope.extend(this, hope.Cookie.get("Docutron"));
		this.selectedThing = hope.dereference(this.selectedThing, hope.GlobalContext) || hope;

		// default details for the different types of things
		this.details = hope.Cookie.get("DocutronDetails") || this.details;
		
		// set up history to start with hope
		this.history = [hope];
		
		this.draw();
	},

	// initial draw only
	draw : function() {
		if (this._drawn) return;
		
		// wait until body has loaded
		if (!document.body) return setTimeout(this.draw.bind(this), 0);

		// draw the thing and stick it in the body
		this.$element = Expander.byId("DocutronMain").toElements(this)[0];
		document.body.insert(this.$element);
	
		//
		// set up the horizontal splitter
		//
		//this.hsplit = new hope.Splitter(this, this.$hsplit());
		
		this.$element.parseCustomTags(this);
		
		this.$historyList(this.getHistoryHTML());
		this._drawn = true;
		
		this.select(this.selectedThing);
		
		this.afterDraw();
	},

	afterDraw : function() {},

	// return the sizes for the splitter
	getSplitSizes : function(elementSize) {
		if (this.hsplit) return this.hsplit.getSizes();
		return ["50%","50%"];
	},



	saveCookie : function() {
		hope.Cookie.set("Docutron", {
			selectedThing : this.selectedThing.globalRef,
			width : this.width,
			height : this.height,
			split : this.split,
			left : this.left,
			top : this.top
		});
	},
	saveDetailsCookie : function() {
		hope.Cookie.set("DocutronDetails", this.details);
	},


	// select a top-level thing
	select : function(thing) {
		if (typeof thing == "string") thing = hope.dereference(thing, hope.GlobalContext);
		if (!thing) thing = hope;
		
		var changed = (this.selectedThing != thing);
		if (changed) {
			this.addToHistory(this.selectedThing);
			this.saveCookie();
		}

		this.selectedThing = thing;
		this.selectedDetails = this.details[thing.type];
		
		this.drawThing();
		this.drawThingDetails();

	},


	// note: details MUST be a string
	selectDetails : function(details) {
//console.warn(details);
		var thing = this.selectedThing;
		var changed = (this.details[thing.type] != details);
		this.details[thing.type] = details;
		this.selectedDetails = details;
		this.drawThingDetails();

		if (changed) this.saveDetailsCookie();
	},
	
	
	selectDetail : function(thing, key, type) {
		this.drawThingDetail(thing, key, type);
	},
	
	
	// todo: set size when Detail is not shown?
	resize : function() {
		this.width = Math.min(this.width, document.viewport.getWidth() - this.left);
		this.height = Math.min(this.height, document.viewport.getHeight() - this.top);

		this.$element.style.top = this.top + "px";
		this.$element.style.left = this.left + "px";
		this.$element.style.width = this.width + "px";
		this.$element.style.height = this.height + "px";

		return this.layout();
	},


	// draw the selectedThing in the left panel
	drawThing : function() {
		var thing = this.selectedThing;
		console.info("drawing ",thing);
		
		this.$thingTitle(this.expandTemplate(thing,  "Docutron"+thing.type+"Title", "DocutronThingTitle"));

		// if there is a specific method to draw a thing, call that
		var method = "draw" + thing.type;
		if (typeof this[method] == "function") return this[method](thing);

		// otherwise if there is a template to expand for the thing, expand that
		this.$thingMenu(this.expandTemplate(thing,  "Docutron"+thing.type+"Menu", "DocutronUnknownMenu"));
		this.resize();
	},
	
	
	// draw details of the selectedThing in the left panel
	drawThingDetails : function() {
		console.info("drawing ",this.selectedDetails," of ",this.selectedThing);
		
		// select the menu item for the details
		var $list = this.$thingMenu();
		var anchors = $list.select("A[class*=Selected]");
		anchors.invoke("removeClassName","Selected");
	// TODO: could use [class~=X] to find full class name
		anchors = $list.select("A[ref=\""+this.selectedDetails+"\"]");
		if (anchors) anchors.invoke("addClassName","Selected");
		
		// if there is a specific method to draw a thing, call that
		var method = "draw" + this.selectedDetails;
		if (typeof this[method] == "function") return this[method](this.selectedThing, this.selectedDetails);

		// otherwise if there is a template to expand for the thing, expand that
		var template = "Docutron" + this.selectedThing.type + "Details";
		if (!Expander.byId(template)) template = "DocutronUnknownThingDetails";
		
		return this.$thingContents(Expander.byId(template).expand(this.selectedThing));
	},
	
	
	drawThingDetail : function(thing, key, type) {
		if (!this._detailShown) {
			// TODO: animate open
			this.$detail().style.display = "";
			this._detailShown = true;
			this.resize();
		}

		var ref = eval(thing +"."+key);
		if (!ref) console.error("selectDetail(): Can't find ",thing+"."+key);

		// if there is a specific method to draw a thing, call that
		var method = "draw" + this.type;
		if (typeof this[method] == "function") return this[method](thing, key, type);

		this.$detailTitle(thing + "." + key);
		this.$detailContents(""+ref);
	},
	
	
	
	// 
	// specialized drawing routines
	//
	
	drawThings 		: function() {		return this.drawRegistry();		},
	drawClasses 	: function() {		return this.drawRegistry();		},
	drawSingletons 	: function() {		return this.drawRegistry();		},
	drawMixins 		: function() {		return this.drawRegistry();		},
	drawPatterns 	: function() {		return this.drawRegistry();		},
	drawFactories 	: function() {		return this.drawRegistry();		},


	drawLocations 	: function() {		return this.drawRegistry();		},
	drawTemplates 	: function() {		return this.drawRegistry();		},
	
	
	
	drawRegistry : function() {
		var registry = hope[this.selectedDetails];
		var things = Object.values(registry);
	
		var html = things.collect(function(thing) {
			return hope.Docutron.getThingItemHTML(thing);
		}).join("\n");
		
		this.$thingContents(html);
	},
	


	drawInheritance : function() {
		var thing = this.selectedThing,
			html = ""
		;

		html += this.getThingListHTML(thing, hope.Supers.get(thing.id), "Supers", "(none)");
		html += this.getThingListHTML(thing, hope.Subs.get(thing.id), "Subs", "(none)");
		html += this.getThingListHTML(thing, hope.Requires.get(thing.id), "Requires", "(none)");
		html += this.getFileListHTML(thing, (thing.params || thing).expanders, "Templates", "(none)");
		html += this.getFileListHTML(thing, (thing.params || thing).styles, "Styles", "(none)");
	
		this.$thingContents(html);
	},
	
	drawInstances : function() {
		var thing = this.selectedThing,
			registry = thing.registry,
			html = ""
		;
		for (var key in registry) {
			html += this.getThingItemHTML(registry[key]);
		
		}
	
		this.$thingContents(html);
	},



	//
	//	generic assemblers
	//
	drawMethods : function(thing) {
		return this._drawMethods(thing, { globalRef : thing.globalRef, type:"Function" });
	},

	drawPrototypeMethods : function(thing) {
		return this._drawMethods(thing.prototype, { globalRef : thing.globalRef+".prototype", type:"Function" });
	},

	_drawMethods : function(object, props) {
		var methods = [];
		for (var key in object) {
			if (typeof object[key] == "function" && !object[key].isAClass) methods.push(key);
		}
		methods.sort();		// TODO: case insensitive sort
		var html = methods.collect(function(method) {
			props.key = method;
			props.value = ""+object[method];
			if (props.value.length > 50) props.value = props.value.substr(0,50)+"...";
			props.inherited = (props.value == object.constructor.prototype[method] ? "Inherited" : "")
			return Expander.byId("DocutronDetailItem").expand(props);
		}).join("\n");
		this.$thingContents(html);
	},

	
	drawDefaults : function(thing) {
		return this._drawDefaults(thing, { globalRef : thing.globalRef });
	},

	drawPrototypeDefaults : function(thing) {
		return this._drawDefaults(thing.prototype, { globalRef : thing.globalRef });
	},

	_drawDefaults : function(object, props) {
		var keys = [];
		for (var key in object) {
			if (typeof object[key] != "function") keys.push(key);
		}
		keys.sort();		// TODO: case insensitive sort
		var html = (keys.collect(function(key) {
			var value = object[key],
				type = (value != null ? (value.type ? value.type : typeof value) : "unknown")	// TODO: handle .type as well?
			;
			props.key = key;
			props.type = type.capitalize();
			props.value = value;
			
			return Expander.byId("DocutronDetailItem").expand(props);
		})).join("\n");
		this.$thingContents(html);
	},

	

	//
	//	generic html assembly
	//
	
	getThingTitleHTML : function(thing) {
		if (typeof thing == "string") thing = hope.dereference(thing, hope.GlobalContext);
		return Expander.byId("DocutronThingTitle").expand(thing);
	},
	
	// return a list surround + a list of things in "item" mode
	getThingListHTML : function(thing, list, listName, emptyMessage) {
		var props = {
			thing : thing,
			listName : listName,
			listHTML : this.getThingItemsHTML(list)
		}
		if (props.listHTML == "" && emptyMessage) props.listHTML = emptyMessage;
		return Expander.byId("DocutronThingList").expand(props);
		
	},

	// return just a list of items, no surrounding list
	getThingItemsHTML : function(list) {
		return list.collect(function(thing) {
			return hope.Docutron.getThingItemHTML(thing);
		}).join("");
	},

	// return the drawing for a single thing in "item" mode
	getThingItemHTML : function(thing) {
		if (typeof thing == "string") thing = hope.dereference(thing, hope.GlobalContext);
		return Expander.byId("DocutronThingListItem").expand(thing);
	},



	getFileListHTML : function(thing, list, listName, emptyMessage) {
		var props = {
			thing : thing,
			listName : listName,
			listHTML : ""
		}
		if (list == null || list.length == 0) {
			if (emptyMessage) props.listHTML = emptyMessage;
		} else {
			props.listHTML = list.collect(function(url) {
											props.url = url;
											return Expander.byId("DocutronFileListItem").expand(props);
										}).join("");
		}
		return Expander.byId("DocutronThingList").expand(props);
	},
	
	
	//
	//	expand the first template we come across
	//
	expandTemplate : function(thing, template1, template2, etc) {
		var template = template1, arg = 1;
		while (Expander.byId(template) == null) {
			template = arguments[++arg];
			if (!template) break;
		}
		if (!Expander.byId(template)) return "couldn't find template:"+$A(arguments).join(",");
		return Expander.byId(template).expand(thing);
	},



	//
	//	history
	//
	addToHistory : function(thing) {
		if (this.history.include(thing)) return;

		this.history.push(thing);
		var element = this.$historyList();
		if (element) element.innerHTML += this.getThingItemHTML(thing);
	},

	getHistoryHTML : function() {
		return this.getThingItemsHTML(this.history);
	}

});


