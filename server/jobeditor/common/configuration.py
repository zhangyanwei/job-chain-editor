import collections
import os
import re
from collections import deque
from threading import RLock

import yaml
from cachetools import cached, TTLCache, keys

from ._utils import init_repository, list_files, list_repository_files, read_file, write_file, write_data

KEY_CONFIGURATION_REPOSITORY = 'configuration'
KEY_CONFIGURATION = 'git_path'


cache = TTLCache(1, 3600)
lock = RLock()


def __get_nested(value: dict, path: [str, list], default=None):
    if type(path) == str:
        return __recursive_get_nested(value, deque(path.split()), default)
    else:
        return __recursive_get_nested(value, deque(path), default)


def __recursive_get_nested(value: collections.Mapping, keys: deque, default=None):
    if len(keys) > 0:
        attr = keys.popleft()
        value = value.get(attr)
        if value is not None:
            if isinstance(value, collections.Mapping):
                return __recursive_get_nested(value, keys, default)
            if isinstance(value, object):
                return __recursive_get_nested(vars(value), keys, default)
    return value if value is not None else default


def __list_configuration_files(id_pattern: str):
    return list_repository_files(KEY_CONFIGURATION_REPOSITORY, id_pattern, KEY_CONFIGURATION)


def __update_index(directory):
    index_path = os.path.join(directory, '_index.yaml')
    index_content = []
    file_paths = list_files(directory, '*')
    for file_path in file_paths:
        conf_id, _ = os.path.splitext(os.path.basename(file_path))
        if conf_id.startswith('_'):
            continue
        yaml_content = read_file(file_path)
        index_content.append({
            'id': conf_id,
            'name': yaml_content.get('name', conf_id)
        })
    write_file(index_path,
               yaml.safe_dump(index_content, default_flow_style=False, sort_keys=False, allow_unicode=True))
    return index_content


def __refresh_index(directory, file_cache, file_lock):
    # Update the index file, then clear the code, to ensure next request can retrieve the new configuration list out.
    __update_index(directory)
    # make sure access to cache is synchronized
    with lock:
        cache.clear()
    # Clear the index cache.
    index_key = keys.hashkey(os.path.join(directory, '_index.yaml'))
    with file_lock:
        if file_cache.get(index_key):
            del file_cache[index_key]


@cached(cache, lock=lock)
def __index_configurations():
    repository, abspath, _ = init_repository(KEY_CONFIGURATION_REPOSITORY, KEY_CONFIGURATION)
    repository.reset()
    # The definitions definitely not exist when the directory not exists.
    if not os.path.isdir(abspath):
        return []

    index_path = os.path.join(abspath, '_index.yaml')
    if os.path.isfile(index_path):
        return read_file(index_path)

    # Create the index file if not exists.
    return __update_index(abspath)


def list_configurations():
    return __index_configurations()


def get_configuration(conf_id: str, path: list = None, default=None):
    file_paths = __list_configuration_files(conf_id)
    for file_path in file_paths:
        configuration = read_file(file_path)
        if path is None:
            return configuration
        else:
            return __get_nested(configuration, path, default)
    raise FileNotFoundError(f'Not found the configuration: \'{conf_id}\'.')


def write_configurations(configurations: dict):
    # ( file_name, data )
    data = [(f'{conf_id}.yaml', data) for conf_id, data in configurations.items()]
    write_data('configuration', 'git_path', data, __refresh_index)

