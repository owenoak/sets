f//
//	ClassFactory -- creator/loader for Classes and Mixins and such
//	


//
//	TOFIGURE: 
//				- break up into Loader (L$) and ClassFactory (C$) ?
//				- Class.globalize == true means put reference into global scope on identify()
//				- wrap, etc all loses debuggability, SOOO
//						C$.createFunction(methodName, args, body)
//							- in normal mode returns new Function(args, body)
//							- in debug mode, returns eval("(function "+methodName+"("+args+"){"+body+"})");
//	
//




//
//	Glossary of types below
//
//
//	* Location 				== a Location object
//	* PathOrLocation 		== < "base/path" || "#{namedLocation}/with/possible/path" || Location >
//	* Arguments				== arguments array
//	* ThingLocationMap		== map of { "Thing" : Location, "Thing" : Location, ... }					





//
//	global context
//
ClassFactory.GlobalContext : Object			// Object	: object in which we place all created classes
ClassFactory.GlobalContextName : "name"		// String	: window[ClassFactory.GlobalContextName] == ClassFactory.GlobalContext


//
//	constructors and constructor setup routines
//

ClassFactory.ClassConstructor(params)		// Function	: method used to create Classes (just calls method, DOES NOT new ClassConstructor()
ClassFactory.SetUpClass(params)				// Function : called to set up the Class after creation with ClassFactory.ClassConstructor(params)

ClassFactory.MixinConstructor(params)		// Function	: method used to create Classes (just calls method, DOES NOT new Mixin)
ClassFactory.SetUpMixin(params)				// Function : called to set up the Mixin after creation with ClassFactory.ClassConstructor(params)


//
//	data structures which can be queried  (all are ListMaps)
//

ClassFactory.Things				==>	"Thing" : [ "Thing", "Thing", ... ]
ClassFactory.Classes			==> "Class" : [ "Class", "ClassOrMixin", "ClassOrMixin", ... ]
ClassFactory.Mixins				==> "Mixin" : [ "Mixin", "Mixin", ... ] 


ClassFactory.Supers				==> "Thing"
ClassFactory.Subs

ClassFactory.Locations			==> < "Thing" || "/partial/path" || "namedLocation" > : [ Location, Location, ...]
ClassFactory.LocationsToThings	==> "full/path" : [ "Thing", "Thing", ... ]


// onload handlers which have NOT been executed yet
ClassFactory.Onloads			==> "Thing" : [ Function, Function, Function ]


// Creator function for Thing (only if Thing has not been created yet)
//	Note: this is not a ListMap, just a simple hash ?
ClassFactory.Creators			==> "Thing" : Function



//
//	constructors
//


// create a new Class AFTER all dependencies are loaded
//	returns true if already completed, false means deferred
ClassFactory.createClass("Class", 
	{
		identifier			: "isAClass",					// name of boolean property set to true on all instances
															//	so we can tell if they are subclasses
															//	default:   isA<Class>
		plural				: "PluralOfClass",
		supers 				: < "Class Mixin Pattern ..." || ["Class", "Mixin", "Mixin", ...] || { "Class" : {props}, "Mixin" : {props} }>
		requires 			: < "Thing Thing Thing ..." || ["Thing","Thing","Thing", ...] >
		basePath 			: < "/path/to/file" 		|| "#{namedLocation}" || Location >,
		filePath			: "/explicit/path/to/file.js",			
				
		defaults			: < {...} or [ {...}, {...}, ...] >,
		methods				: < {...} or [ {...}, {...}, ...] >,
		
		classDefaults		: < {...} or [ {...}, {...}, ...] >,	// handle mixins?
		classMethods		: < {...} or [ {...}, {...}, ...] >,	// handle mixins?
		
		registryDefaults	: < {...} or [ {...}, {...}, ...] >,
		registryMethods		: < {...} or [ {...}, {...}, ...] >,
		
		inheritClassProps 	: boolean,		// default == false
		
		initialize 			: Function		// intializor for the class
	}

)	==> boolean



// create a new Mixin AFTER all dependencies are loaded
//	returns true if already completed, false means deferred
ClassFactory.createMixin("Mixin", 
	{
		identifier			: "isAMixin",					// name of boolean property set to true on all instances
															//	so we can tell if they implement this mixin
															//	default:   isA<Mixin>
		supers 				: < "Thing Thing ..." || ["Thing", "Thing", ...] >
		requires 			: < "Thing Thing ..." || ["Thing","Thing", ...] >
		basePath 			: PathOrLocation,
		onload				: < Function || [ Function, Function] >,	// called (on mixin as this) after file is loaded
		onapply				: < Function || [ Function, Function] >,	// called (on instance as this) after mixin applied to instance

		props				: < {...} || [ {...}, {...}, {...}, ...] >
	}

)	==> boolean
ClassFactory.applyMixin("Mixin", toWhat);
Mixin.applyTo(toWhat);


// Create a Pattern AFTER all dependencies are loaded
// A Pattern is kinda like a mixin, but it takes a set of parameters AT APPLY TIME
//	  which it uses to mangle the object according to a design pattern
//
// Applying a Pattern more than once with different paramters is an interesting thing to do
//
//	returns true if already completed, false means deferred
ClassFactory.createPattern("Pattern",
	{
		require 			: < "Thing", "Thing", "Thing" >
	}
)	==> boolean
ClassFactory.applyPattern("Mixin", toWhat, params);
Pattern.applyTo(toWhat, params);

Pattern.create(params) 		-- alias for Pattern.applyTo({}, params)


// create an instance AFTER its Class has been loaded
//	and executes Function after load
//	returns true if already completed, false means deferred
ClassFactory.create("Class", < {...} || Arguments >, Function)
	

// execute an arbitrary function when all things have been loaded
//	returns true if already completed, false means deferred
ClassFactory.onload("Thing Thing Thing", Function)
ClassFactory.onload(["Thing", "Thing", "Thing"], Function)
	==> boolean
	
	

//
//	reflection
//

// returns true iff all things are currently loaded
ClassFactory.isLoaded( "Thing Thing ...")			
ClassFactory.isLoaded( "Thing", "Thing", ...)		
ClassFactory.isLoaded( [ "Thing", "Thing", ... ] )	
ClassFactory.isLoaded( { "Thing" : Location, "Thing" : Location, ...} )	
	==> boolean


ClassFactory.getSupers("ClassOrMixin")
	==> [ Thing, Thing, ... ]
	==> returns false if all supers are not defined

ClassFactory.getSubs("ClassOrMixin")
	==> [ Thing, Thing, ... ]
	==> returns false if all subs are not defined   (is this possible?)



//
//	resolving paths and such
//

// resolve a Thing or path to a Location, possibly relative to a base path
ClassFactory.resolve("Thing", 		 PathOrLocation)
ClassFactory.resolve(PathOrLocation, PathOrLocation)
	==>	Location 

// resolve a set of things
ClassFactory.resolve( ["Thing", "Thing", ...], PathOrLocation)
	==>	{	"Thing" : Location, "Thing" : Location, ... }

ClassFactory.resolve( [PathOrLocation, PathOrLocation, ...],   PathOrLocation)
	==>	{	Location.href : Location, Location.href : Location, ... }




//
// getting dependencies (recursively)
//

// get dependencies for all things (and all their dependencies)
//		(cool:  we can just load them all and check the Supers maps)
ClassFactories.dependencies( "Thing Thing Thing", 			PathOrLocation)	
ClassFactories.dependencies( ["Thing", "Thing", "Thing" ],	PathOrLocation)
	=> {
			"Thing" : Location,
			"Thing" : Location,
			"Thing" : Location
		}

ClassFactory.fileDependencies("file/path/to/file<.html||.js||.css>", PathOrLocation)
	=> {
			scripts : {	"Thing" : Location, "Thing", Location, ... },
			css 	: {	"Thing" : Location, "Thing", Location, ... }
		}




// Notes on Class creation semantics
//
//	- Abbreviate "ClassFactory" as "C$"  ?
//
//	- For each Class:

	Class.id = "Class"										
	C$.GlobalContext["Class"] = Class

	Class.Classes = "PluralOfClass"							// Name of Plural --  DIFFERENT PROPERTY NAME ?
	Class.Registry = []										// registry of instances (by # and by id) which have been identified()
	C$.GlobalContext["PluralOfClass"] = Class.Registry		// 

	Class.instanceProperties = {}							// instance properties (NOT incl. mixins) we were created with
															//	if created with more than one set, they will be merged (?)

//	- Class Methods
	Class.identify = Function(instance)						// make sure the instance has an id and register it in Class.Registry
		// TODO:  check if id is same as prototype.id
		//			so we can give ids to prototypes
	Class.byId = Function(id, creationArgs)					// if instance is defined
															// 		returns a pointer to Class.Registry[id]
															// if not defined, 
															//		creates an instance with creationArgs and identifies() it


//	- For each Class.prototype
	prototype.constructor = Class
	prototype.Class = "Class"
	prototype[Class.identifier] = true 						// true for all classes we implement
	prototype[Mixin.identifier] = true						// true for all mixins we implement
	prototype.identify = Function							// calls class.identify to give us an id and register the instance

// for each instance after identify()
	instance.id
	instance.globalRef	
