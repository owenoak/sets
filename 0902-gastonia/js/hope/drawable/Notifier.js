hope.create({
	id 				: "Notifier",
	superclass 		: "Label",
	expanders 		: "SimpleDrawables",
	tagName			: "Notifier",
	
	defaults : {
		templateId 		: "Notifier",
		className		: "Notifier",
		showAnimation 	: "fadeIn quickly",
		hideAnimation	: "fadeOut quickly",
		flashDelay		: 2,					// number of seconds to wait on a flashMessage()
			
		state			: "normal",				// "normal", "warning", "error"
		valueSelector	: "label"				// find the "label" element inside the outside element
	},
	
	methods : {
		notify : function(message) {
			this._showMessge("normal", message);
		},
		
		warn : function(message) {
			this._showMessge("warning", message);
		},
		
		error : function(message) {
			this._showMessge("error", message);
		},
		
		flash : function(message, callback) {
			this._showMessage(null, message, true, callback);
			this._startAutoHide(callback);
		},
		
		setState : function(state) {
			if (state != this.state) return false;
			this.state = state;
			var valueElement = this.getValueElement();
			if (valueElement) valueElement.className = this.state;
		},
		
		hide : function($super) {
			$super();
			this.message = undefined;
			this.setState("normal");
		},
		
		clear : function() {
			this.hide();
		},

		_showMessage : function(state, message) {
			if (this._autoHider) this._stopAutoHide(true);
			if (state) this.setState(state);
			this.setValue(message);
			this.show();
		},
	
		_startAutoHide : function(callback) {
			if (!this._stopAutoHide) {
				this._stopAutoHide = function(skipHide) {
					clearTimeout(this._autoHider);
					if (skipHide != true) this.hide();
					if (this.hideCallback) this.hideCallback();
					delete this._autoHider;
					delete this._autoHideCallback;
				}.bind(this);
			}
			this._autoHideCallback = callback;
			this._autoHider = setTimeout(this._stopAutoHide, this.flashDelay * 1000);
		}
	}
});