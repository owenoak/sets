	//
	//	an Inheritable is a simple object which will automatically re-instantiate itself
	//	 in initInstance() to be-a-copy-of-but-have-a-protoype-pointer-back-to 
	//	 its prototype value of the same name
	//
	//	Basic property of an Inheritable is that when an instance is created and extendInstance()
	//		is called on it, the instance will be cloned and some optional method will be called
	//		on it.
	//
	//
	hope.Inheritable = function Inheritable(defaults) { hope.extend(this, defaults); }
	hope.Inheritable.isInheritable = true;
	hope.Inheritable.initInstance = function (instance, key, defaults) {
		var protoVal = (instance && instance.constructor.prototype[key]),
			constructor = hope.Inheritable
		;
		if (protoVal && protoVal.constructor.isInheritable) {
			var constructor = _Inheritable;
			constructor.prototype = protoVal;
		}
		return new constructor(defaults);
	}
	
	// private class which is used when we need to construct an Inheritable with a prototype above
	_Inheritable = function _Inheritable(defaults) { hope.extend(this, defaults); }
	_Inheritable.isInheritable = true;
	_Inheritable.initInstance = hope.Inheritable.initInstance;
