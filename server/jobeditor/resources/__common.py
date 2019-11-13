from flask import request
from ..common.errors import ApiError


def check_request_json():
    body = request.json
    if not body:
        raise ApiError(ApiError.bad_request, 'Missing request body.')
