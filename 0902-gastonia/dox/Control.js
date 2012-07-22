var Control = Class.create(ProtoWidget, {
	klass					: "Control",
	isAControl				: true,
	
	value					: undefined,
	reference				: undefined,

	name					: undefined,		// name of the control, must be unique within its controller
	
	title					: undefined,
	titleHint				: undefined,
	description				: undefined,
	
	
	className				: "Control",
	style					: undefined,
	attributes				: undefined,
	tabIndex				: undefined,
	showErrorIcon			: false,
	
	outerTag 				: undefined,		// generally comes from our parent, defaults to 'span'
	outerTagAttributes		: undefined,

	titleOuterTag			: undefined,
	titleOuterAttributes	: undefined
	titleAttributes			: undefined,
	
	dynamicTitle			: false,			// set to true to update title when we update
												// will be set to true automatically if title is a function
	
	drasticProperties 		: undefined,		// properties which will force a full redraw when set after draw
	
	modelAttributes			: $w("title description adjustValue required requiredMessage typeMessage typeLabel"),
	
	
	//
	//	setters
	//
	setProperties : function(properties) {
		var drasticChange = false;
		for (var key in properties) {
			if (this.drasticProperties && this.drasticProperties[key]) drasticChange = true;
			var setter = key.setter(), value = properties[key];
			if (this[setter]) 	this[setter](value);
			else 				this[key] = value;
		}
		if (!this.$element) return;

		if (drasticChange) 	this.draw();
		else				this.update();
	},
	
	// set our data attribute
	setAttribute : function(attribute) {
		this.attribute = attribute;
		this.modelAttributes.forEach(function(key) {
			if (attribute[key]  && this[key] == null)
				this[key] = attribute[key];
		}, this);
	},
	
	setTitle : function(title) {
		this.title = title;
// TODO: do this on draw() so we'll pick up from the model
		if (typeof this.title == "function") this.dynamicTitle = true;
	},
	
	setDescription : function(description) {
		this.description = description;
// TODO: do this on draw() so we'll pick up from the model
		if (this.description.indexOf("#{") > -1) this.dynamicTitle = true;
	},
	
	
	
	//
	// drawing
	//
	
	
	draw : function(parent) {
		var old = this.$outer || this.globalId;
		this.replaceWithTemplate(old, this.OuterTemplate, parent);
		this.update();
	},
	
	update : function(clearError) {
		this.setValue(this.getValue(), true);
		if (typeof this.title == "function") this.updateTitle();
		if (clearError) this.clearError();
		if (this.validateOnUpdate) this.validate();
	},
	
	getValue : function() {
		if (this.reference) return this.controller.getControlValue(this);
		return this.value;
	},
	
	setValue : function(value, updateElement) {
		this.value = value;
		if (updateElement != false) this.setElementValue(value);
	},
	
	// return HTML attributes -- className, disabled + the following list:
	attributeNames : $w("reference style name tabIndex maxLength type"),
	getAttributes : function() {
		var output = ["className='"+this.className+"'"];
		if (this.enabled != true) output.push("disabled='true'");
		this.attributeNames.forEach(function(name) {
			if (this[name] != null) output.push(name + "='"+this[name].makeQuoteSafe()+"'");
		}, this);
		if (this.attributes) output.push(this.attributes);
		return output.join(" ");
	},
	
	getEventHandlers : function() {
		if (!this.eventHandlers) return "";
		var output = [];
		this.eventHandlers.forEach(function(handler) {
			handler = handler.split(":");
			var eventName = handler[0],
				method = handler[1] || handler[0]
			;
			output.push(eventName+"='return this.control."+method+"($e(event), this)'");
		}, this);
		return output.join(" ");
	},
	
	
	replaceWithTemplate : function(id, template, parent) {
		var newElement = Element.htmlToElement(template.evaluate(this));
		var oldElement = $(id);
		if (oldElement) {
			oldElement.parent.replaceChild(newElement, oldElement);
		} else {
			if (!parent) parent = document.body;		// TOWARN
			parent.appendChild(newElement);
		}
	},
	
	//
	//	title drawing
	//
	
	getTitleAttributes : function() {
		var output = [
			"for='"+this.globalId+"'",
			"className='"+this.titleClassName+"'"
		];
		if (this.description) output.push("title='" + this.description.makeQuoteSafe() + "'");
		if (this.titleAttributes) output.push(this.titleAttributes);
		return output.join(" ");
	},
	
	getTitle : function() {
		if (typeof this.title == "string") return this.title.interpolate(this);
		return this.title(this.controller, this.controller.value);
	},
	
	drawTitle : function(parent) {
		var oldTitle = this.$titleOuter || this.globalId+"_title";
		this.replaceWithTemplate(oldTitle, this.TitleOuterTemplate, parent);
	},
	
	// assumes the title has been drawn already
	updateTitle : function() {
		this.replaceWithTemplate(this.$title, this.TitleInnerTemplate);
	},
	
	
	// attach elements from the HTML to the JS objects the correspond to
	attachElements : function(root) {
		var toAttach = root.select("[hopeid]");
		toAttach.forEach(function(element) {
			if (element.control) return;
			var what = element.getAttribute("hopeid").split("$");
			var object = hope.Id[what[0]];
			element.control = object;
			object["$"+what[1]] = element;
		}, this);
	},
	
	
	<!-- todo: put reference here so we can style based on reference? -->
	<template name='OuterTemplate'>
		<#{it.outerTag||'span'} hopeid='#{it.globalId}$outer' #{it.outerAttributes}>
			#{it.InnerTemplate.evaluate(it)}
			#{it.showErrorIcon ? it.ErrorIconTemplate.evaluate(it) : ''}
		</#{it.outerTag||'span'}>
	</template>
	
	<template name='InnerTemplate'>
		<input id='#{it.globalId}' hopeid='#{it.globalId}$element'
			#{it.getAttributes()}
			#{it.getEventHandlers()}
		>
	</template>
	
	<template name='TitleOuterTemplate'>
		<#{it.titleOuterTag||'span'} hopeid='#{it.globalId}$titleOuter' #{it.titleOuterAttributes}>
			#{it.TitleInnerTemplate.evaluate(it)}
			#{it.TitleHint ? "<span class='Hint'>"+it.titleHint+"</span>"}
		 </#{it.titleOuterTag||'span'}>
	</template>
	
	<template name='TitleInnerTemplate'>
		<title for='#{it.globalId}' hopeid='#{it.globalId}$title' #{it.getTitleAttributes()}>
			#{it.getTitle()}
		</title>
	</template>
	
	<template name='ErrorIconTemplate'>
		<span class='ErrorIcon' hopeid='#{globalId}$errorIcon'></span>
	</template>
