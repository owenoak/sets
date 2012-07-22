// class used to test createClass
hope.create({
	id : "test::Pirate", 
	superclass : "test::Person", 
	methods : {
		say : function($super, message) {
			return $super(message+", yarr");
		}
	}
});
