# get environment variables
import os
docRoot = os.environ.get("DOCUMENT_ROOT")
fileName = os.environ.get("SCRIPT_FILENAME")
requestUri = os.environ.get("REQUEST_URI")


#list all environment variables
cgi.print_environ()


# output debug stuff on script error
import cgi, cgitb
cgitb.enable()


