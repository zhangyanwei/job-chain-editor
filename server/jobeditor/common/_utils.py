import configparser
import glob
import os
from threading import RLock

import yaml
import yaml.resolver
from cachetools import cached, TTLCache, keys
from flask import current_app as app
from jenkins.common.executor import LocalExecutor
from jenkins.common.repository import Repository
from jenkins.job_description import _read_yaml


cache = TTLCache(128, 1800)
lock = RLock()


def write_file(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(data)


def get_instance_path():
    return app.config['APPLICATION_INSTANCE_PATH']


def get_config_path():
    return app.config['APPLICATION_CONFIG_PATH']


@cached(TTLCache(1, 3600))
def get_config_dict():
    config = configparser.ConfigParser()
    config.read(get_config_path())
    the_dict = {}
    for section in config.sections():
        the_dict[section] = {}
        for key, val in config.items(section):
            the_dict[section][key] = val
    return the_dict


def create_repository(repository_name: str, path_key: str):
    config_dict = get_config_dict()
    repo_config_dict = config_dict.get(repository_name, {})
    git_executor = config_dict.get('executor', {}).get('git_executor') or 'git {}'
    related_path = repo_config_dict.get(path_key, '')
    repository = Repository(
        executor=LocalExecutor(git_executor=git_executor),
        directory=f'{get_instance_path()}/{repository_name}'
    )
    abspath = repository.abspath(related_path)
    return repository, abspath, repo_config_dict


def init_repository(repository_name: str, path_key: str):
    repository, abspath, git_configs = create_repository(repository_name, path_key)
    if not git_configs:
        raise EnvironmentError(f'Missing the {repository_name} section in the application configuration file.')
    git_url = git_configs.get('git_url')
    if not git_url:
        raise EnvironmentError(f'Missing the \'git_url\' option in {repository_name} section.')
    repository.init(
        git_url,
        git_configs.get('git_username'),
        git_configs.get('git_password'),
        git_configs.get('git_branch'),
        reset=False
    )
    return repository, abspath, git_configs


def list_files(directory: str, pattern: str, extensions=None):
    if extensions is None:
        extensions = ['yaml', 'yml']
    return [item for p in [
        glob.glob(os.path.join(directory, f'{pattern}.{e}')) for e in extensions] for item in p]


def list_repository_files(repository_name: str, id_pattern: str, path_key: str, extensions: list = None):
    repository, abspath, _ = init_repository(repository_name, path_key)
    return list_files(abspath, id_pattern, extensions)


@cached(cache, lock=lock)
def read_file(path: str):
    return _read_yaml(path)


def write_data(repository_name: str, path_key: str, data: list, additional=None):
    # Init repository
    repository, abspath, git_configs = init_repository(repository_name, path_key)
    repository.reset()

    # Write the data into the destination files.
    for file_name, content in data:
        path = os.path.join(abspath, file_name)
        if content is None:
            os.path.isfile(path) and os.remove(path)
        else:
            write_file(path, yaml.safe_dump(content, default_flow_style=False, sort_keys=False, allow_unicode=True))
        # make sure access to cache is synchronized
        key = keys.hashkey(path)
        with lock:
            if cache.get(key):
                del cache[key]

    # Do additional modifications.
    additional and additional(abspath, cache, lock)
    if bool(repository.local_diff()):
        try:
            # Commit and push the file into remote repository.
            directory = git_configs.get(path_key)
            repository.commit('Edited by the JobEditor.', f'{directory}/*')
            repository.push()
        except Exception:
            # Reset the repository if there any error occurs.
            repository.reset()
            raise
