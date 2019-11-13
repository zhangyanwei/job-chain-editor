from ..common.errors import ApiError


def register(encoders):
    def encode(value: ApiError):
        return {
            'code': value.code,
            'message': value.message
        }
    encoders[ApiError] = encode
