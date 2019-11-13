import importlib
import os

from flask.json import JSONEncoder


class AutoJSONEncoder(JSONEncoder):

    registered_encoders = dict()

    def default(self, obj):
        try:
            encoder = AutoJSONEncoder.registered_encoders.get(type(obj), None)
            if encoder:
                return encoder(obj)
            iterable = iter(obj)
        except TypeError:
            pass
        else:
            return list(iterable)
        return JSONEncoder.default(self, obj)


def register(app):
    app.json_encoder = AutoJSONEncoder
    for file in os.listdir(os.path.dirname(__file__)):
        if not file.startswith('__'):
            mod_name = file[:-3]   # strip .py at the end
            m = importlib.import_module('.' + mod_name, package=__package__)
            r = getattr(m, 'register', None)
            if r:
                r(AutoJSONEncoder.registered_encoders)
