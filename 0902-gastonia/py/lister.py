import os
import glob

class lister:
	"""
		Return list of full paths
			from lister import lister
			print lister(extension="*.js").fullPaths

		Return list of paths local to root
			from lister import lister
			print lister(extension="*.js").paths

		Return list of files split into [ ['path/', 'file.ext'], ... ]
			from lister import lister
			print = lister(extension="*.js").toJson()
	"""
	def __init__(self, root="/www/hope/js/hope/", dir="", extension="*", recurse=True):
		self.root = root
		self.dir = dir
		self.recurse = recurse
		self.extension = extension

		# get the list of files
		#TODO: check for path ending with "/"
		if recurse == True: dir += "*/"
		self.fullPaths = glob.glob(root + dir + extension)

		#strip the root off the resulting paths
		rootLength = len(root)
		self.paths = [path[rootLength:] for path in self.fullPaths]


	def toJson(self):
		import simplejson as json

		list = [os.path.split(path) for path in self.paths]
		return json.dumps(list, indent=2, check_circular=False)


# http://docs.python.org/library/os.html#os.walk
#import os
#from os.path import join, getsize
#for root, dirs, files in os.walk('python/Lib/email'):
#    print root, "consumes",
#    print sum(getsize(join(root, name)) for name in files),
#    print "bytes in", len(files), "non-directory files"
#    if 'CVS' in dirs:
#        dirs.remove('CVS')  # don't visit CVS directories