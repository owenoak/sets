var URL_RE = /(((?:(\w*:)\/\/)(([^\/:]*):?([^\/]*))?)?([^?]*\/)?)(([^?]*)(\.[^?]*)?)(\?[^#]*)?(#.*)?/

var url = "http://server:port/path/to/file.html.foo?p1=v1&p2=v2#hash";
console.warn(url);
console.warn(URL_RE.exec(url));