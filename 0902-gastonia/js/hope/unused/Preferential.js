hope.create({
	id 			: "Preferential",
	superclass 	: "Mixin",
	requires	: "DataStore",
	
	initialize : function() {
		hope.Preferences = new DataStore({id:"hopePreferences"});
	},
	
	methods : {
		getPreference	: function(key) 		{	return hope.Preferences.get(this, key)			},
		setPreference	: function(key, value) 	{	return hope.Preferences.set(this, key, value)	},
		clearPreference : function(key) 		{	return hope.Preferences.clear(this, key)		},
	}
});