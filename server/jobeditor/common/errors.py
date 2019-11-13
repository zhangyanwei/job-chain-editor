from flask import jsonify


def register(app):

    @app.errorhandler(Exception)
    def handle_api_error(e: Exception):
        return jsonify({'code': 'UNCAUGHT', 'message': str(e)}), 500

    @app.errorhandler(FileNotFoundError)
    def handle_not_found_error(e):
        return jsonify({'code': 'NOT_FOUND', 'message': str(e)}), 404

    @app.errorhandler(EnvironmentError)
    def handle_api_error(e: EnvironmentError):
        return jsonify({'code': 'ENV_ERROR', 'message': str(e)}), 500

    @app.errorhandler(ApiError)
    def handle_api_error(e: ApiError):
        return jsonify({'code': e.code, 'message': str(e.message)}), e.status


class ApiError(Exception):

    bad_request = ('BAD_REQUEST', 400)
    not_found = ('NOT_FOUND', 404)

    def __init__(self, code, message):
        self.code, self.status = code
        self.message = message
