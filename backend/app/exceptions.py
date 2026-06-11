"""Domain-level exceptions, mapped to HTTP responses by the error handler."""


class AppError(Exception):
    status_code = 400
    default_detail = "Bad request"

    def __init__(self, detail: str | None = None):
        self.detail = detail or self.default_detail
        super().__init__(self.detail)


class BadRequestError(AppError):
    status_code = 400
    default_detail = "Bad request"


class AuthError(AppError):
    status_code = 401
    default_detail = "Authentication failed"


class PermissionDeniedError(AppError):
    status_code = 403
    default_detail = "You do not have permission to perform this action"


class NotFoundError(AppError):
    status_code = 404
    default_detail = "Resource not found"


class ConflictError(AppError):
    status_code = 409
    default_detail = "Resource conflict"
