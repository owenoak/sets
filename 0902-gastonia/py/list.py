#!/usr/bin/python
print "Content-type: text/javascript\n\n"
import cgi, cgitb
cgitb.enable()
form = cgi.FieldStorage()

import os
root = form.getfirst("root",os.environ.get("DOCUMENT_ROOT"))
dir = form.getfirst("dir","")
extension = form.getfirst("extension","*")
recurse = form.getfirst("recurse","true") == "true"


from lister import lister
list = lister(root=root, dir=dir, extension=extension, recurse=recurse).toJson()
print list

