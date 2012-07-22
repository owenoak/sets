
console.time("execute normal fn");
function f1() {	return null	};
for (var i = 0; i < 10000; i++) {
	f1();
}
console.timeEnd("execute normal fn");

console.time("execute eval()d fn");
eval("function f2() {	return null	};");
for (var i = 0; i < 10000; i++) {
	f2();
}
console.timeEnd("execute eval()d fn");

console.time("execute eval()d fn");
var f3 = new Function("return null");
for (var i = 0; i < 10000; i++) {
	f3();
}
console.timeEnd("execute eval()d fn");

