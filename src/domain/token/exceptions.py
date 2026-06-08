class TokenNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__( "Token is not found.")


class TokenExpiredError(Exception):
    def __init__(self) -> None:
        super().__init__( "Refresh or access token has expired. Please log in again.")