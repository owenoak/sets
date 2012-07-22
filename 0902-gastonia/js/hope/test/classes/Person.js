// class used to test createClass
hope.create({
	id : "test::Person", 
	superclass : "test::Mammal",
	methods : {
		initialize : function($super, id) {
			$super(id);
			this.favoriteDrink = "beer";
		},
		say : function(message) {
			message = this.constructor.id + " " + this.id + " says: "+message;
			console.warn(message);
			return message;
		}
	}
});
