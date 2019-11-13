from flask import Blueprint
from flask import request
from flask_restful import Api
from flask_restful import Resource

from ..common.configuration import *


# noinspection PyTypeChecker
def register(app):
    module_name = __name__.split('.')[-1]
    api_bp = Blueprint(module_name, app.name, url_prefix='/configurations')
    api = Api(api_bp)

    api.add_resource(Configurations, '', '/', endpoint=module_name)
    api.add_resource(Configuration, '/<conf_id>', endpoint='configuration')
    app.register_blueprint(api_bp)


class Configurations(Resource):

    def get(self):
        return list_configurations()

    def put(self):
        # check_request_json()
        configurations = request.json
        write_configurations(configurations)
        return None, 204


class Configuration(Resource):

    def get(self, conf_id: str):
        return get_configuration(conf_id)
