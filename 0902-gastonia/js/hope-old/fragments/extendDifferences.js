
// extend dest with properties of source that are different than dest props
// returns object with differences, or null if no diffs found
Object.extendDifferences = function(dest, source) {
	var diffs = {}, found = false;
	for (var key in source) {
		if (dest[key] == source[key]) continue;
		dest[key] = diffs[key] = source[key];
		found = true;
		
	}
 	return (found ? diffs : null);
}
