from cachetools import LRUCache
import json
import os

class _JsonDict(dict):
    def __init__(self, data : dict, file : 'JsonFile'):
        super().__init__(data)
        self.file = file

    def __setitem__(self, key, value):
        super().__setitem__(key, value)
        if self.file.autosave: self.file.save()

    def __delitem__(self, key):
        super().__delitem__(key)
        if self.file.autosave: self.file.save()
    
    def pop(self, key):
        item = self[key]
        super().__delitem__(key)
        if self.file.autosave: self.file.save()
        return item
    
    def copy(self):
        return super().copy()

class _JsonList(list):
    def __init__(self, data : list, file : 'JsonFile'):
        super().__init__(data)
        self.file = file

    def __setitem__(self, index, value):
        super().__setitem__(index, value)
        if self.file.autosave: self.file.save()

    def __delitem__(self, index):
        super().__delitem__(index)
        if self.file.autosave: self.file.save()
    
    def append(self, value):
        super().append(value)
        if self.file.autosave: self.file.save()
    
    def remove(self, value):
        super().remove(value)
        if self.file.autosave: self.file.save()
        
class CustomDecoder(json.JSONDecoder):
    def __init__(self, file : 'JsonFile'):
        super().__init__()
        self.file = file

    def _remove_comments(self, s):
        longcomment = False
        lines = []
        for line in s.split('\n'):
            line = str(line.strip())
            doubleslash = line.find('//')
            slashastrsk = line.find('/*')
            astrskslash = line.find('*/')

            # Commenti singoli // 
            if line.count('\"',0,doubleslash) % 2 == 0 and doubleslash >= 0:
                line = line[:doubleslash]

            #Fine commento lungo */
            if longcomment:
                if astrskslash >= 0:
                    longcomment = False
                    line = line[astrskslash+2:]
                else: continue

            #Inizio commento lungo /*
            if line.count('\"',0,slashastrsk) % 2 == 0 and slashastrsk >= 0:
                if astrskslash < 0: longcomment = True
                line = line[:slashastrsk]

            if line != '': lines.append(line)
        return '\n'.join(lines)
            
    def decode(self, s):
        if self.file.commented:
            s = self._remove_comments(s)
        try:
            obj = dict(super().decode(s))
        except json.decoder.JSONDecodeError as e:
            print(e)
        else:
            for key,value in obj.items():
                if isinstance(value, dict):
                    obj[key] = _JsonDict(value,self.file)
                elif isinstance(value, list):
                    obj[key] = _JsonList(value,self.file)
                else:
                    obj[key] = value
            return obj

cache = LRUCache(maxsize=100)

class JsonFile(dict):
    def __init__(self, fp : str,*, indent : int = 4, encoding : str = 'utf-8', autosave : bool = True, commented : bool = False):
        """
        Subclass of dict for loading or creating JSON files.

        !! Warning !! 
        Not all dict methods supports :autosave: feature.
        """
        assert fp.endswith('.json') or fp.endswith('.jsonc'),'fp must be a json file and end with ".json" or ".jsonc" (JSON with comments)'
        self.commented = True if fp.endswith('.jsonc') else commented
        self.encoding = encoding
        self.autosave = autosave
        self.indent = indent
        self.fp = os.path.realpath(os.path.normpath(fp))

        if fp not in cache:
            if os.path.exists(fp):
                with open(fp,encoding=encoding) as jsf:
                    fileobj = json.load(jsf,cls=CustomDecoder,file=self)
                    super().__init__(fileobj)
                    cache[fp] = fileobj
                    print(f"Currently cached json files: {[key for key, value in cache.items()]}")
            else:
                super().__init__()
        else:
            fileobj = cache[fp]
            
            super().__init__(fileobj)

    def __getitem__(self, key) -> _JsonDict | dict:
        return super().__getitem__(key)

    def __setitem__(self, key, value):
        if isinstance(value,dict):
            data = _JsonDict(value, self)
        elif isinstance(value,list):
            data = _JsonList(value, self)
        else: 
            data = value

        self.update({key : data})
        
        if self.autosave: self.save()

    def __delitem__(self, key):
        if key in dict(self.items()):
            self.pop(key)
            if self.autosave: self.save()
        else:
            raise KeyError(f"Key '{key}' not found in '{self.fp}'.")
    
    def __iter__(self):
        return iter(self.content)

    def copy(self):
        return JsonFile(self.fp,indent=self.indent,encoding=self.encoding,autosave=self.autosave)

    def save(self, fp : str = None):
        with open(self.fp if fp is None else fp,'w',encoding=self.encoding) as jsf: json.dump(self,jsf,indent=self.indent)