import os

from flask import Flask

from . import common
from . import jsonencoder
from . import resources


def create_app():
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    # instance_path = app.instance_path
    instance_path = os.path.join(os.getcwd(), 'instance')
    application_config_path = os.path.join(instance_path, 'application.ini')

    if not os.path.isfile(application_config_path):
        raise EnvironmentError(f'Missing \"application.ini\"...should be exists in \"{application_config_path}\"')

    app.config.from_mapping(
        APPLICATION_INSTANCE_PATH=instance_path,
        APPLICATION_CONFIG_PATH=application_config_path,
    )
    # ensure the instance folder exists
    try:
        os.makedirs(instance_path)
    except OSError:
        pass

    # auto register all resources
    common.register(app)
    jsonencoder.register(app)
    resources.register(app)
    return app
