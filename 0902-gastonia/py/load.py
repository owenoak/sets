#!/usr/bin/python
print "Content-type: text/html\n\n"
import sys
sys.stderr = sys.stdout

import cgitb
import cgi
cgitb.enable()

form = cgi.FieldStorage()

import json
parsed = json.parser(form.getfirst("file")).parsed
print parsed

print "<br><html><head>"
print ""
print "</head><body>"
print "Test Page"
print "</body></html>"