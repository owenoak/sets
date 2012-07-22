var DataModel = Class.create({
	klass : "DataModel",
	
	attributes : undefined,
	
	// NOTE: your subclass should NOT $super to this -- this is for setting up the Model itself
	initialize : function(properties) {
		Object.extend(this, properties);
		if (!this.attributes.__initialized) this.initAttributes();
	},
	
	
	//
	//	data model value getting/setting
	//
	setData : function(newValue, vaildate) {
		this.data = newValue;
		if (validate) this.validateData();
	},
	
	getData : function() {
		return this.data;
	},


	//
	//	attribute getting/setting
	//

	get : function(attributeName) {
		// inline for speed
		var attribute = (typeof attribute == "string"
							? this.attributes[attribute]
							: attributeName);
		return attribute.getValue(this);
	},
	
	getScaled : function(attributeName) {
		var attribute = this.getAttribute(attributeName);
		return attribute.getScaled(this);
	},
	
	toDisplayValue : function(attributeName) {
		var attribute = this.getAttribute(attributeName);
		return attribute.toDisplayValue(this);
	},
	
	fromDisplayValue : function(attributeName) {
		var attribute = this.getAttribute(attributeName);
		return attribute.fromDisplayValue(this);
	},
	
	set : function(attributeName, newValue) {
		var attribute = this.getAttribute(attributeName);
		return attribute.setValue(this, newValue);
	},


	//
	//	validation
	//
	validateData : function() {
		TODO();
	},
	


	//
	//	attribute manipulation
	//
	initAttributes : function() {
		var attributes = this.attributes;
		for (var key in attributes) {
			if (key.indexOf("__") == 0) continue;
			
			var attribute = attributes[key];
			if (attribute.isADataAttribute) continue;
			
			var type = attribute.type || "string",
				constructor = DataModel.AttributeClasses[type] || DataAttribute
			;
			attributes[key] = new constructor(this, key, attribute);
		}
		attributes.__initialized = true;
	},
	
	getAttribute : function(attribute) {
		if (typeof attribute == "string") return this.attributes[attribute];
		return attribute;
	}
});



var DataAttribute = Class.create({
	klass : "DataAttribute",
	isADataAttribute : true,

	adjustValue : false,					// if true, we will try to adjust an invalid value
											//	to make it valid when validating

//	value : null,							// default value
//	summary : null,
//	
	
	required : false,						// can be a function
	requiredMessage : "Value is required",

	typeMessage : "Must be a #{typeLabel}",
	typeLabel : "UNDEFINED TYPE",

	initialize : function(model, name, properties) {
		this.properties = properties;
		
		// remember the current validators so we can add to them
		var validators = (this.validators ? [].concat(this.validators) || []);
		
		this.model = model;
		this.name = name;
		Object.extend(this, properties);

		if (this.trim) validators.push(DataValidators.trim);
		if (this.required) validators.push(DataValidators.required);
		
		this.validators = this.initValidators(validators);
		if (properties.validators) this.validators = this.validators.concat(properties.validators);

		properties.validators = validators;
	},
	
	// override this to do type-specific validators
	initValidators : function(validtors) {},
	
	getValue : function(instance) {
		return instance.data[this.name];
	},
	
	setValue : function(instance, newValue) {
		var validated = this.validate(instance, newValue);
		instance.data[this.name] = validated;
		return validated;
	},
	
	toDisplayValue : function(value) {
		return value;
	},
	
	fromDisplayValue : function(value) {
		return value;
	},
	
	validate : function(instance, newValue) {
		TODO();
		// iterate through the validators
		// if we get a warning, we can keep going
		// if not, need to stop
	},

	getTypeMesage : function(instance) {
		return this.typeMessage.interpolate(this);
	},
	
	getRequiredMessage : function(instance) {
		return this.requiredMessage.interpolate(this);
	},
	
	getRangeMessage : function(instance) {
		TODO;
	}
});



var StringAttribute = Class.create(DataAttribute, {
	klass : "StringAttribute",

	// trim whitespace
	trim : false,					// trim whitespace at beginning and end

	// restrict min and max length of the string
	min : undefined,				// min length
	max : undefined,				// max length
	rangeMessage : "#{min} to #{max} #{typeLabel}",

	// restrict to a particular set of characters
	charset : undefined,			// legal characters
	replacementChar : "_",			// character to transform illegal chars to when adjusting
	typeLabel : "letters",
	
	// restrict to matching a particular regular expression pattern
	pattern : undefined,			// regular expression to match
	patternMessage : "Does not match the pattern (set patternMessage to customize this string)",
	
	// valueMap -- map of value -> displayValue items
	valueMap : undefined,
	
	initValidators : function(validators) {
		if (this.min != null || this.getMin != this.constructor.prototype.getMin)
			validators.push(DataValidators.minLength);
			
		if (this.max != null || this.getMax != this.constructor.prototype.getMax)
		 	validators.push(DataValidators.maxLength);
		
		if (this.charset != null) 	validators.push(DataValidators.restrictChars);
		if (this.pattern) != null)	validators.push(DataValidators.pattern);
		return validators;
	},
	
	toDisplayValue : function(value) {
		if (!this.valueMap) return value;
		var mapped = this.valueMap[value];
		return (mapped !== undefined ? mapped : this.value);
	},
	
	// NOTE: trims the value
	// NOTE: return the first value found, or undefined if not found in the value map
	fromDisplayValue : function(value) {
		if (this.trim) value = value.trim();
		if (!this.valueMap) return value;

		for (var key in this.valueMap) {
			if (this.valueMap[key] == value) return key;
		}
		return undefined;
	},

	getMin : function(instance) {
		return this.min;
	},
	
	getMax : function(instance) {
		return this.max;
	}
});



var EnumAttribute = Class.create(DataAttribute, {
	klass : "EnumAttribute",

	values : undefined,					// list of valid values
	valueMap : undefined,				// map of value -> displayValue

	toDisplayValue : function(value) {
		if (!this.valueMap) return value;		// TODO: throw if value is not in values ?
		var mapped = ths.valueMap[value];
		return (mapped !== undefined ? mapped : this.value);
	},
	
	fromDisplayValue : function(value) {
		if (this.trim) value = value.trim();
		if (this.valueMap) return value;
		for (var key in this.valueMap) {
			if (this.valueMap[key] == value) return key;
		}
		return undefined;
	}
});



var NumberAttribute = Class.create(DataAttribute, {
	klass : "IntegerAttribute",

	min : undefined,
	max : undefined,

	scale : 1,
	precision : undefined,
	displayPrecision : undefined,
	commaize : false,

	rangeMessage : "a #{typeLabel} between #{_min} and #{_max}",
	typeMessage : "Must be a #{typeLabel}",
	typeLabel	: "number",

	scaleParser : /^\s*(-?\d*.?\d*)\s*([kmbt])/i,
	scaleMap : {
		k : 1000,
		m : 1000000,
		b : 1000000000
		t : 1000000000000
	},
	
	initValidators : function(validators) {
		validators.push(DataValidators.toFloat);

		if (this.min != null || this.getMin != this.constructor.prototype.getMin)
			validators.push(DataValidators.minLength);
			
		if (this.max != null || this.getMax != this.constructor.prototype.getMax)
		 	validators.push(DataValidators.maxLength);
		
		return validators;
	},

	toDisplayValue : function(value) {
		if (isNaN(value) || typeof value != "number") return value;		// TODO: ??? default?

		value *= this.scale;
		
		if (this.displayPrecision) value = value.limitDigits(this.displayPrecision);
		if (this.commaize) value = value.commaize();
		return value;
	},
	
	// returns NaN if can't parse the value
	fromDisplayValue : function(value) {
		if (typeof value == "number") return value;
		
		if (this.commaize) value = value.split(",").join("");
		
		// see if there's a scale in the display value
		scale = 1;
		var match = value.match(this.scaleParser);
		if (match)  scale = this.scaleMap[match[2]];
		scale *= this.scale;

		value = parseFloat(value) * scale;
		if (isNaN(value)) return value;
		
		if (this.precision !== undefined) {
			value = value.limitDigits(this.precision);
		}
		return value;
	},
	
	getScaled : function(instance) {
		return this.getValue(instance) * this.scale;
	},
	
	getRangeMesage : function(instance) {
		this._min = this.getMin(instance);
		this._max = this.getMax(instance);
		return this.typeMessage.interpolate(this) + " " + this.rangeMessage.interpolate(this);
	},

	getMin : function(instance) {
		return this.min;
	},
	
	getMax : function(instance) {
		return this.max;
	},
	
	pinToRange : function(value) {
		var max = this.getMax(),
			min = this.getMin()
		;
		if (value < min) return min;
		if (value > max) return max;
		return value;
	}
});


var IntegerAttribute = Class.create(NumberAttribute, {
	klass : "IntegerAttribute",
	typeLabel : "integer",
	displayPrecision : 0,
	precision : 0
});


var BytesAttribute = Class.create(NumberAttribute, {
	klass : "BytesAttribute",
	typeLabel : "number of bytes",
	displayPrecision : 2,
	
	toDisplayValue : function(value) {
		if (isNaN(value) || typeof value != "number") return value;		// TODO: ??? default?
		value *= this.scale;
		return value.toBytesString(this.displayPrecision);
	},
	
	fromDisplayValue : function(value) {
		if (typeof value == "number") return value;
		
		value = value.fromBytesString();
		if (isNaN(value)) return value;		// XXX
		
		value = value / this.scale;
		return value.limitDigits(this.precision);
	}
});


var BooleanAttribute = Class.create(DataAttribute, {
	klass : "StringAttribute",
	typeLabel : "#{trueLabel} or #{falseLabel}",

	trueValue : true,
	falseValue : false,
	
	trueLabel : "true",
	falseLabel : "false",
	
	toDisplayValue : function(value) {
		return (value == this.trueValue ? this.trueLabel : this.falseLabel);
	},
	
	fromDisplayValue : function(value) {
		if (typeof value == "boolean") 
			return (value ? this.trueValue : this.falseValue);

		return (value == this.trueLabel ? this.trueValue : this.falseValue);
	}
});




DataModel.AttributeClasses = {
	"string" : StringAttribute,
	"integer" : IntegerAttribute,
	"bytes" : BytesAttribute,
	"enum" : EnumAttribute,
	"boolean" : BooleanAttribute
}






var DataValidators = {
	required : function(attr, instance, newValue) {
		var required = (typeof attr.required == "function" 
						? attr.required(instance, newValue) 
						: attr.required
					   );
		if (!required) return;
		
		if (newValue == null || newValue == "") 
			throw new ValidationError(attr.name, attr.getRequiredMessage(instance));
	},
	
	trim : function(attr, instance, newValue) {
		newValue = (newValue == null ? "" : ""+newValue);
		return newValue.trim();
	},
	
	minLength : function(attr, instance, newValue) {
		newValue = (newValue == null ? "" : ""+newValue);
		if (newValue.length < attr.getMin(instance)) 
			throw new ValidationError(attr.name, attr.getRangeMessage(instance));
	},
	
	maxLength : function(attr, instance, newValue) {
		if (newValue == null || newValue == "") return;
		newValue = ""+newValue;
		
		var max = attr.getMax(instance);
		if (newValue.length > max)
			throw new ValidationError(attr.name, attr.getRangeMessage(instance)
										newValue.substring(0, max)
			);
	},
	
	pattern : function(attr, instance, newValue) {
		newValue = (newValue == null ? "" : ""+newValue);
		var match = newValue.match(attr.pattern);
		if (!match) 
			throw new ValidationError(attr.name, attr.patternMessage.interpolate(attr));
	},
	
	restrictChars : function(attr, instance, newValue) {
		newValue = (newValue == null ? "" : ""+newValue);
		for (var i = 0, legal = [], len = newValue.length; i < len; i++) {
			var nextChar = newValue.charAt(i);
			legal[i] = (attr.charset.indexOf(nextChar) == -1 ? attr.replacementChar : nextChar);
		}
		legal = legal.join("");
		if (legal == newValue) return;
		
		throw new ValidationError(attr.name, attr.getRangeMessage(instance), legal);
	},


	// note: actually transforms number to a float
	toFloat : function(attr, instance, newValue) {
		var parsed = parseFloat(newValue);
		if (isNaN(parsed))
			throw new ValidationError(attr.name, attr.getTypeMessage(instance));
		return parsed;
	},


	// note: actually transforms number to an int
	toInteger : function(attr, instance, newValue) {
		var parsed = parseInt(newValue);
		if (isNaN(parsed)) throw new ValidationError(attr.name, attr.getTypeMessage(instance));
		return parsed;
	},

	minValue : function(attr, instance, newValue) {
		var parsed = parseFloat(newValue), min = attr.getMin(instance);
		if (isNaN(parsed)) throw new ValidationError(attr.name, attr.getTypeMessage(instance));
		if (parsed < min) return;
			throw new ValidationError(attr.name, attr.getRangeMessage(instance), min);
	},
	
	maxValue : function(attr, instance, newValue) {
		var parsed = parseFloat(newValue), max = attr.getMax(instance);
		if (isNaN(parsed)) throw new ValidationError(attr.name, attr.getTypeMessage(instance));
		if (parsed > max)
			throw new ValidationError(attr.name, attr.getRangeMessage(instance), max);
	}
}
