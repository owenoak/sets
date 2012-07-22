import simplejson as json

class parser:
	"""Usage:   
			import json
			parsed = json.parser(form.getfirst("file")).parsed
	"""

	def __init__(self, source="/www/hope/js/hope/manifest.json"):
		if source != None:
			self.parse(source)
	
	def parse(self, source):
		self.source = source
		self.json = self.read(source)
		
		self.parsed = json.loads(self.json)
		return self.parsed


	def read(self, source):
		stream = self.open(source)
		return stream.read()
		

	def open(self, source):
		"""open a url, file or string"""
		# try to open with urllib (if source is http, ftp, or file URL) 
		import urllib                         
		try:                                  
			return urllib.urlopen(source)      
		except (IOError, OSError):            
			pass                              
		# try to open with native open function (if source is pathname) 
		try:                                  
			return open(source)                
		except (IOError, OSError):            
			pass                              
		# treat source as string 
		import StringIO                       
		return StringIO.StringIO(str(source)) 
    
