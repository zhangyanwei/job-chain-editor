from flask import Blueprint
from flask_restful import Api
from flask_restful import Resource

from ..common.definitions import *


# noinspection PyTypeChecker
def register(app):
    module_name = __name__.split('.')[-1]
    api_bp = Blueprint(module_name, app.name, url_prefix='/definitions')
    api = Api(api_bp)

    # api.add_resource(Definitions, '', '/', endpoint=module_name)
    api.add_resource(Definition, '/steps/<step_id>', endpoint='definition_step')
    api.add_resource(EventHandler, '/event-handlers/<handler_id>', endpoint='definition_event_handler')
    api.add_resource(StepIndices, '/indices/steps', endpoint='indices_step')
    api.add_resource(EventIndices, '/indices/event-handlers', endpoint='indices_event_handler')
    app.register_blueprint(api_bp)


class Definition(Resource):

    def get(self, step_id: str):
        ret = {'id': step_id}
        definition = get_definition_step(step_id)
        if definition is not None:
            ret.update(definition)
        return ret


class EventHandler(Resource):

    def get(self, handler_id: str):
        ret = {'id': handler_id}
        definition = get_definition_event_handler(handler_id)
        if definition is not None:
            ret.update(definition)
        return ret


class StepIndices(Resource):

    def get(self):
        return get_step_definition_indices()


class EventIndices(Resource):

    def get(self):
        return get_event_handler_definition_indices()
