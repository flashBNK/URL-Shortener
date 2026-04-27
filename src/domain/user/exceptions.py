class UserNotFoundError(Exception):

    def __init__(self, user_id: int) -> None:
        super().__init__( f"User with id={user_id} not found.")
        self.user_id = user_id


class UserNotFound(Exception):
    def __init__(self) -> None:
        super().__init__( f"User is not found.")