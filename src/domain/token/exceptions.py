class TokenNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__( f"Token is not found.")


class TokenExpiredError(Exception):
    def __init__(self) -> None:
        super().__init__( f"Refresh token has expired. Please log in again.")