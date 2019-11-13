import os

import yaml
from cachetools import cached, TTLCache

from ._utils import init_repository, list_files, list_repository_files, read_file, write_file

KEY_DEFINITION_REPOSITORY = 'definition'
KEY_DEFINITION_STEP = 'git_definition_step_path'
KEY_DEFINITION_EVENT_HANDLER = 'git_definition_event_handler_path'


def __list_definition_step_files(id_pattern: str):
    return list_repository_files(KEY_DEFINITION_REPOSITORY, id_pattern, KEY_DEFINITION_STEP)


def __list_definition_event_handler_files(id_pattern: str):
    return list_repository_files(KEY_DEFINITION_REPOSITORY, id_pattern, KEY_DEFINITION_EVENT_HANDLER)


@cached(TTLCache(128, 3600))
def __index_definitions(path_key: str):
    """
    This function will read the files one by one, then generate the index file if not exists.
    BTW, will cache the files through the `read_configuration` function.
    :return: None
    """
    repository, abspath, _ = init_repository(KEY_DEFINITION_REPOSITORY, path_key)
    repository.reset()

    # The definitions definitely not exist when the directory not exists.
    if not os.path.isdir(abspath):
        return []

    index_path = os.path.join(abspath, '_index.yaml')
    if os.path.isfile(index_path):
        return read_file(index_path)

    # Generate the index file if not exists.
    index_content = []
    file_paths = list_files(abspath, '*')
    for file_path in file_paths:
        key, _ = os.path.splitext(os.path.basename(file_path))
        if key.startswith('_'):
            continue
        content = read_file(file_path)
        index_content.append({
            'id': key,
            'name': content.get('name'),
            'description': content.get('description')
        })
    write_file(index_path,
               yaml.safe_dump(index_content, default_flow_style=False, sort_keys=False, allow_unicode=True))
    return index_content


def get_definition_step(step_id: str):
    file_paths = __list_definition_step_files(step_id)
    for file_path in file_paths:
        return read_file(file_path)


def get_definition_event_handler(handler_id: str):
    file_paths = __list_definition_event_handler_files(handler_id)
    for file_path in file_paths:
        return read_file(file_path)


def get_step_definition_indices():
    return __index_definitions(KEY_DEFINITION_STEP)


def get_event_handler_definition_indices():
    return __index_definitions(KEY_DEFINITION_EVENT_HANDLER)
