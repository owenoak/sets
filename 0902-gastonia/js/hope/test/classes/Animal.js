// class used to test createClass
hope.create({
	id : "test::Animal",
	superclass:"BaseClass",
	methods : {
		initialize : function(id) {
			this.id = id;
			this.favoriteDrink = "water";
		},
		sleep : function() {
			this.say("zzzzz");
			return this;
		},
		say : function(message) {
			message = this.constructor.id + " " + this.id + " can't talk but is thinking ("+message+")";
			console.warn(message);
			return this;
		}
	}
});
