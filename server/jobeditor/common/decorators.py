import collections
from functools import wraps

from flask import jsonify


def serialize(func):
    @wraps(func)
    def decorated(*args, **kwargs):
        r = func(*args, **kwargs)
        if r is not None:
            return jsonify(r)
        return r
    return decorated


def remove_nulls(func):

    def remove(value):
        if isinstance(value, collections.Mapping):
            return {k: remove(v) for k, v in value.items() if v is not None}
        if type(value) == list:
            return [remove(v) for v in value]
        if type(value) == set:
            return {remove(v) for v in value}
        return value

    @wraps(func)
    def decorated(*args, **kwargs):
        r = func(*args, **kwargs)
        if r is not None:
            return remove(r)
        return r
    return decorated
