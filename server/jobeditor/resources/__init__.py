import importlib
import os


def register(app):
    for file in os.listdir(os.path.dirname(__file__)):
        if not file.startswith('__') and file.endswith('.py'):
            mod_name = file[:-3]   # strip .py at the end
            m = importlib.import_module('.' + mod_name, package=__package__)
            m.register(app)
