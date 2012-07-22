Object.extend(Array.prototype, {
		map : function(fn, context) {
			for (var i = 0, l = this.length, out = []; i < l; i++) 
				if (i in this) out[i] = fn.call(context, this[i], i, this);
			return out;
		},
		filter : function(fn, context, stopIf) {
			var ;
			for (var i = 0, l = this.length, out = [], it, found; i < l; i++) {
				if (!(i in this)) continue;
				found = (!!fn.call(context, (it = this[i]), i, this));
				if (found) out.push(it);
				if (stopIf != null && found == stopIf) return out;
			}
			return out;
		},
		every : function(fn, context) {
			return (this.filter(fn, context, false).length == this.length);
		},
		
		some : function(fn, context) {
			return (this.filter(fn, context, true).length > 0);
		}
});