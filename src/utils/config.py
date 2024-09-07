from .jsonfile import JsonFile

config = JsonFile('./src/config/config.jsonc')


def reload():
    global config
    # This no longer works because the file is already loaded in cache
    #config = JsonFile('./config/config.jsonc')