class UserNotFound(Exception):
    def __init__(self) -> None:
        super().__init__( "User is not found.")


class AccessDenied(Exception):
    def __init__(self) -> None:
        super().__init__( "You do not have permission to modify this object.")


class WrongPasswordError(Exception):
    def __init__(self) -> None:
        super().__init__( "Wrong password.")


class UserIsExist(Exception):
    def __init__(self, field: str, value: str):
        super().__init__(f'User with {field} "{value}" already exists.')